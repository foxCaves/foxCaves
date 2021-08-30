export class BaseModel {
    created_at: Date = new Date();
    updated_at: Date = new Date();

    convertDates() {
        this.created_at = new Date(this.created_at);
        this.updated_at = new Date(this.updated_at);
    }

    wrap(obj: unknown) {
        Object.assign(this, obj);
        this.convertDates();
        return this;
    }
}
