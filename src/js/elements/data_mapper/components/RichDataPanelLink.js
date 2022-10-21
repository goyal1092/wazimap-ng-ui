import React from 'react';
import {createRoot} from 'react-dom/client';
import {Component} from "../../../../utils";

export class RichDataPanelLink extends Component {
    constructor(parent, container) {
        super(parent);
        this.root = createRoot(container);
    }

    render(props) {
        if (props.showRichDataPanelLink) {
            this.root.render(
                <div> Show it up </div>
            );
        }

    }
}