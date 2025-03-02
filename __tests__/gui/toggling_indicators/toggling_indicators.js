import {Given, Then, When} from "cypress-cucumber-preprocessor/steps";
import {gotoHomepage, setupInterceptions, waitUntilGeographyIsLoaded} from "../common_cy_functions/general";
import all_details from "../toggling_indicators/all_details.json";
import profiles from "./profiles.json";
import profile from '../toggling_indicators/profile.json';

Given('I am on the Wazimap Homepage', () => {
    setupInterceptions(profiles, all_details, profile, null, null);
    gotoHomepage();
})

Then('I wait until map is ready', () => {
    waitUntilGeographyIsLoaded('South Africa Test');
})

When('I expand Data Mapper', () => {
    cy.wait(1000);
    cy.get('.point-mapper-toggles .data-mapper-panel__open').click();
})

Then('Data Mapper should be displayed', () => {
    cy.get('.data-mapper-content__list').should('be.visible');
})

When('I click on {word} in Data Mapper', () => {
    cy.get('.data-category__h1_title').contains('Demographics').click();
})

Then('I select an indicator', () => {
    cy.get('.data-category__h1_content').contains('Population (2016 Community Survey)').click();
    cy.get('.data-category__h2_content').contains('Population group').click();
    cy.get('.data-category__h3_content').contains('Black african').click();
})

When('I select another indicator', () => {
    cy.get('.data-category__h1_content').contains('Population (2011 Census)').click();
    cy.get('.data-category__h2_content').contains('Population group 2').click();
    cy.get('.data-category__h3_content').contains('Indian or Asian').click();
})

Then('I check if everything is zero', () => {
    cy.get('.map-options__legend_wrap .map_legend-block .truncate').each(($div) => {
        expect($div.text()).not.equal('0.0%');
    })
})

When('I navigate to EC and check if the loading state is displayed correctly', ()=>{
    //intercepting the request and testing the loading state
    //for more info : https://blog.dai.codes/cypress-loading-state-tests/
    let sendResponse;
    const trigger = new Promise((resolve) => {
        sendResponse = resolve;
    });

    cy.intercept('/api/v1/all_details/profile/8/geography/EC/?version=test&format=json', (request) => {
        return trigger.then(() => {
            request.reply({
                statusCode: 201,
                body: all_details,
                forceNetworkError: false // default
            })
        });
    });

    cy.visit('/#geo:EC');

    cy.get('.data-mapper-content__loading').should('be.visible').then(() => {
        cy.get('.data-mapper-content__list').should('not.be.visible');
        sendResponse();
        cy.get('.data-mapper-content__loading').should('not.be.visible');
        cy.get('.data-mapper-content__list').should('be.visible');
    });
})