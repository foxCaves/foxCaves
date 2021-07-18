print("Building...")
dofile("template.lua")

local DISTDIR = "../dist"

local function storeTemplate(name, maintitle, file, params)
    file = file or name
    params = params or {}
    params.MAINTITLE = maintitle
    local template = evalTemplate(name, params)
    local fh = io.open(DISTDIR .. "/" .. file .. ".html", "w")
    fh:write(template)
    fh:close()
end

os.execute("mkdir -p '" .. DISTDIR .. "'")
os.execute("mkdir '" .. DISTDIR .. "/legal'")
os.execute("mkdir '" .. DISTDIR .. "/email'")

storeTemplate("live", "Cam", "cam")
storeTemplate("email", "Activation E-Mail", "email/activation", { ACTION = "activation" })
storeTemplate("email", "Forgot password", "email/forgotpwd", { ACTION = "forgotpwd" })
storeTemplate("emailcode", "E-Mail code check")
storeTemplate("index", "Home")
storeTemplate("terms_of_service", "Terms of Service", "legal/terms_of_service")
storeTemplate("privacy_policy", "Privacy policy", "legal/privacy_policy")
storeTemplate("live", "Live drawing")
storeTemplate("login", "Login")
storeTemplate("myaccount", "My account")
storeTemplate("myfiles", "My files")
storeTemplate("mylinks", "My links")
storeTemplate("register", "Register")
storeTemplate("view", "View file")

print("Done!")
