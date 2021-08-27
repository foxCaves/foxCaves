import React, { ChangeEvent } from 'react';

export class FormBasePage<A, B> extends React.Component<A, B> {
    constructor(props: A) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event: ChangeEvent<HTMLInputElement>) {
        let value = event.target.value;
        if (event.target.type === 'checkbox' && !event.target.checked) {
            value = '';
        }
        this.setState({
            [event.target.name]: value,
        } as unknown as B);
    }
}
