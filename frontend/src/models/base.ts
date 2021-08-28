export class DatedModel {
    created_at: Date = new Date();
    updated_at: Date = new Date();

    convertDates() {
        this.created_at = new Date(this.created_at);
        this.updated_at = new Date(this.updated_at);
    }
}
