import {checkIterate, getFilterGroups, Observable} from '../utils';
import {format as d3format} from 'd3-format';
import {SubindicatorFilter} from "../profile/subindicator_filter";
import DropdownMenu from "./dropdown_menu";

const wrapperClsName = 'content__map_current-display';
const mapOptionsClass = '.map-options';
const filterRowClass = '.map-options__filter-row';
const filterContentClass = '.map-options__filters_content';
const lightStart = 3;

let subindicatorKey = '';

/**
 * Represent the map chip at the bottom of the map
 */
export class MapChip extends Observable {
    constructor(legendColors) {
        super();
        this.legendColors = legendColors;
        this.filterArgs = null;
        this.prepareDomElements();
        this.title = '';
        this.groups = null;
        this.filter = null;
    }

    prepareDomElements() {
        const legendBlock = $('.map_legend-block')[0];
        this.clonedLegendBlock = legendBlock.cloneNode(true);	//a legend block
        this.clonedLegend = $('.map-options__legend')[0].cloneNode(true);	//the legend itself
        this.clearLegend();

        $('a.mapping-options__add-filter').on('click', () => this.addFilter());
    }

    showMapChip(args) {
        $(mapOptionsClass).removeClass('hidden');
        $(mapOptionsClass).show();  //webflow.js adds display:none when clicked on x
        $(mapOptionsClass).find('.filters__header_close').on('click', () => this.removeMapChip());

        $('.map-options__context .map-option__context_text div').text(args.description);
        this.handleChoroplethFilter(args);
    }

    handleChoroplethFilter(args) {
        let primaryGroup = args.data.metadata.primary_group;
        let groups = getFilterGroups(args.data.metadata.groups, primaryGroup);
        this.groups = groups;

        $(mapOptionsClass).find(`${filterRowClass}[data-isextra=true]`).remove();
        const filterArea = $(mapOptionsClass).find(filterContentClass);
        let defaultFilters = [];
        if (typeof args.filter !== 'undefined') {
            Array.prototype.push.apply(defaultFilters, args.filter);
        }

        if (typeof args.data.chartConfiguration.filter !== 'undefined') {
            args.data.chartConfiguration.filter['defaults'].forEach((f) => {
                let defaultFilter = {
                    group: f.name,
                    value: f.value,
                    default: true
                }

                let item = defaultFilters.filter((df) => {
                    return df.group === f.name
                })[0];
                if (item !== null && typeof item !== 'undefined') {
                    item.default = true;
                } else {
                    defaultFilters.push(defaultFilter);
                }
            })
        }

        for (let i = 1; i < defaultFilters.length; i++) {
            this.addFilter(defaultFilters[i].default);
        }
        let dropdowns = $(mapOptionsClass).find(`${filterRowClass} .mapping-options__filter`);

        this.filter = new SubindicatorFilter(filterArea, groups, args.indicatorTitle, this.applyFilter, dropdowns, defaultFilters, args.data.child_data);

        this.setAddFilterButton();
    }

    applyFilter = (filterResult, selectedFilter) => {
        if (filterResult !== null) {
            const payload = {
                data: filterResult,
                selectedFilter: selectedFilter
            }

            this.triggerEvent("mapchip.choropleth.filtered", payload)
        }
    }

    showMapOptions() {
        $(mapOptionsClass).removeClass('hidden');
    }

    showLegend(colors, intervals) {
        if (colors.length != intervals.length)
            throw "Expected the number of intervals to be the same as the number of colours."

        const legend = $(this.clonedLegend);
        const fmt = d3format(".1%")

        $(mapOptionsClass).find('.map-options__legend_wrap').html('');

        for (let i = 0; i < intervals.length; i++) {
            const interval = intervals[i];
            const item = this.clonedLegendBlock.cloneNode(true);
            const label = interval;

            if (i >= lightStart) {
                $(item).addClass('light');
            }

            $('.truncate', item).text(label);
            $(item).css('background-color', colors[i]);
            $(item).css('opacity', this.legendColors.opacity);
            $(mapOptionsClass).find('.map-options__legend_wrap').append(item);
        }
    }

    updateMapChipText(textValue) {
        $(mapOptionsClass).find('.filters__header_name div').text(textValue);
    }

    clearLegend() {
        $(mapOptionsClass).addClass('hidden');
    }

    removeMapChip() {
        const element = $(mapOptionsClass)[0];
        this.clearLegend();
        this.triggerEvent('mapchip.removed', element);
    }

    onChoropleth(payload) {
        this.showLegend(payload.colors, payload.intervals);
    }

    onSubIndicatorChange(args) {
        if (typeof args.data.child_data === 'undefined') {
            return;
        }

        this.filterArgs = args;
        let label = `${args.indicatorTitle} (${args.selectedSubindicator})`;
        if (args.indicatorTitle === args.selectedSubindicator) {
            label = args.indicatorTitle;
        }

        this.title = `${label}`;

        this.updateMapChipText(label);
        this.showMapChip(args);
    }

    setAddFilterButton() {
        if (this.filter.allDropdowns.length >= this.groups.length * 2) {
            $('a.mapping-options__add-filter').addClass('disabled');
        } else {
            $('a.mapping-options__add-filter').removeClass('disabled');
        }
    }

    addFilter(isDefault = false) {
        let filterRow = $(filterRowClass)[0].cloneNode(true);

        let indicatorDd = $(filterRow).find('.mapping-options__filter')[0];
        let subindicatorDd = $(filterRow).find('.mapping-options__filter')[1];

        $(filterRow).attr('data-isextra', true);
        if (!isDefault) {
            this.setRemoveFilter(filterRow, indicatorDd, subindicatorDd);
        }
        $(filterRow).insertBefore($('a.mapping-options__add-filter'));

        new DropdownMenu($(filterRow));
        if (this.filter !== null) {
            this.filter.allDropdowns.push(indicatorDd);
            this.filter.allDropdowns.push(subindicatorDd);
            this.filter.setDropdownEvents(indicatorDd, subindicatorDd);

            this.setAddFilterButton();
        }
    }

    setRemoveFilter(filterRow, indicatorDd, subindicatorDd) {
        let btn = $(filterRow).find('.mapping-options__remove-filter');
        btn.removeClass('is--hidden');
        btn.on('click', () => {
            this.removeFilter(filterRow, indicatorDd, subindicatorDd);
        })
    }

    removeFilter(filterRow, indicatorDd, subindicatorDd) {
        $(filterRow).remove();
        this.filter.allDropdowns = this.filter.allDropdowns.filter((dd, el) => {
            return el !== indicatorDd && el !== subindicatorDd
        })

        this.filter.handleFilter(null);

        this.setAddFilterButton();
    }
}
