return {
    redis = {
        host = "redis",
        port = 6379
    },
    postgres = {
        host = "postgres",
        port = 5432,
        user = "postgres",
        database = "postgres",
        password = "postgres",
        use_migrations = true
    },
    email = {
        host = "localhost",
        port = 25,
        from = "foxcaves@localhost"
    },
    cookies = {
        path = "/",
        httponly = true,
        secure = false,
        samesite = "Strict"
    },
    files = {
        thumbnail_max_size = 50 * 1024 * 1024
    },
    app = {
        enable_user_always_active = true,
        enable_testing_routes = true
    },
    captcha = {
        registration = false,
        login = false,
        forgot_password = false,
        resend_activation = false
    },
    storage = {
        default = "fs",

        fs = {
            driver = "local",
            chunk_size = 8192,
            root_folder = "/var/www/foxcaves/storage"
        }
    },
    http = {
        short_url = "http://short.foxcaves:8080",
        main_url = "http://main.foxcaves:8080",
        redirect_www = false,
        force_plaintext = true,
        upstream_ips = {"127.0.0.1"},
        auto_ssl = {
            ca = "letsencrypt-test"
        }
    },
    sentry = {
        dsn = nil,
        dsn_frontend = nil
    }
}
