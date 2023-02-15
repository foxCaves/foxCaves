export class BaseModel {
    public created_at: Date = new Date();
    public updated_at: Date = new Date();

    public convertDates(): void {
        this.created_at = new Date(this.created_at);
        this.updated_at = new Date(this.updated_at);
    }

    protected wrap(obj: unknown): this {
        Object.assign(this, obj);
        this.convertDates();
        return this;
    }
}
