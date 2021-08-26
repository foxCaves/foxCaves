import { BaseLoggedInPage } from './base';

export class FilesPage extends BaseLoggedInPage<{}, {}> {
    renderSub() {
        return (
            <div>
                <h1>Manage files</h1>
                <p>TODO</p>
            </div>
        );
    }
}
