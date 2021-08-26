import { BasePage } from './base';

export class Home extends BasePage<{}> {
    renderSub() {
        return (
            <div>
                <h1>Home</h1>
                <p>This is the home page</p>
            </div>
        );
    }
}
