return {
    redis = {
        host = "127.0.0.1",
        port = 6379,
    },
    postgres = {
        -- pgmoon options
    },
    email = {
        host = "email-smtp.us-east-1.amazonaws.com",
        user = "",
        password = "",
    },
    urls = {
        short = "http://short.foxcaves",
        main = "http://main.foxcaves",
    },
    sentry = {
        dsn = nil,
        dsn_frontend = nil,
    },
}
