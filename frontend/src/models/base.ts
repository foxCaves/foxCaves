export class BaseModel {
    public created_at: Date = new Date(0);
    public updated_at: Date = new Date(0);

    public convertDates(): void {
        this.created_at = new Date(this.created_at);
        this.updated_at = new Date(this.updated_at);
    }

    public wrap(obj: unknown): this {
        Object.assign(this, obj);
        this.convertDates();
        return this;
    }
}
