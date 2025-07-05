return {
    redis = {
        host = "127.0.0.1",
        port = 6379
    },
    postgres = {
        -- pgmoon options
    },
    email = {
        host = "localhost",
        port = 25,
        from = "foxcaves@localhost",
        admin_email = "admin@localhost"
        -- username = "user",
        -- password = "pass",
        -- ssl = true,
    },
    cookies = {
        path = "/",
        httponly = true,
        secure = true,
        samesite = "Strict"
    },
    files = {
        thumbnail_max_size = 50 * 1024 * 1024
    },
    app = {
        disable_email_confirmation = false,
        require_user_approval = true,
        expiry_check_period = 60 * 15, -- 15 minutes
        executor = "pcall",
    },
    totp = {
        max_past = 1,
        max_future = 1,
        secret_bytes = 20,
        issuer = "foxCaves EXAMPLE"
    },
    captcha = {
        registration = false,
        login = false,
        forgot_password = false,
        resend_activation = false
    },
    storage = {
        default = "fs",

        backends = {
            fs = {
                driver = "local",
                chunk_size = 8192,
                root_folder = "/var/www/foxcaves/storage"
            },

            s3 = {
                driver = "s3",
                chunk_size = 5 * 1024 * 1024,
                read_chunk_size = 8192,

                access_key = "",
                secret_key = "",
                bucket = "example",
                host = "s3.us-west-001.backblazeb2.com",

                keepalive = {
                    pool_size = 100,
                    idle_timeout = 60,
                    max_time = 60 * 60,
                    max_requests = 1000
                }
            },
        }
    },
    http = {
        cdn_url = "http://cdn.foxcaves:8080",
        app_url = "http://app.foxcaves:8080",
        redirect_www = true,
        upstream_ips = { "1.2.3.4" },
        auto_ssl = {
            ca = "letsencrypt-test"
        }
    },
    sentry = {
        dsn = nil,
        dsn_frontend = nil
    }
}
