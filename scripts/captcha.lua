--reCAPTCHA
--[[function check_captcha(POST)
	local tbl = {
		privatekey = "6Lc45NYSAAAAAKtOAsJ6QAe_OlAQFNWdFtVq1Elr",
		remoteip = ngx.var.remote_addr,
		challenge = POST.recaptcha_challenge_field,
		response = POST.recaptcha_response_field
	}
	local response = ngx.location.capture("/scripts/recaptcha_verify", { method = ngx.HTTP_POST, body = ngx.encode_args(tbl)})
	local reply = response.body

	if reply:sub(1,5) == "false" then
		return false, reply:sub(7)
	elseif reply:sub(1,4) == "true" then
		return true, ""
	else
		return false, ""
	end
end
function generate_captcha()
	return load_template("recaptcha")
end]]

--keyCAPTCHA
--[[function check_captcha(POST)
	--NOT IMPLEMENTED YET
end
function generate_captcha()
	return load_template("keycaptcha")
end]]

--doriCAPTCHA
local secret_key = "yiffPENIS2825987436SKLSDJFS$§/&%)%$&/"

local function mktimecode()
	return bit.arshift(ngx.time(), 6)
end
local function mkhash(timecode, result)
	return ngx.hmac_sha1(secret_key, timecode..result..ngx.var.remote_addr)
end
function check_captcha(POST)
	local timecode = mktimecode()
	local result = POST.captcha_result
	local correct = POST.captcha_challenge
	if (not correct) or (not result) then
		return false, "CAPTCHA manipulated"
	elseif correct == "" or result == "" then
		return false, "No CAPTCHA result entered"
	end
	correct = ngx.decode_base64(correct)
	if not correct then
		return false, "CAPTCHA manipulated"
	end
	result = result:lower()
	if mkhash(timecode, result) == correct or mkhash(timecode - 1, result) == correct then
		return true, ""
	else
		return false, "Wrong CAPTCHA result entered"
	end
end

local operators = {
	{"+", function(a,b) return a+b end},
	{"-", function(a,b) return a-b end},
	{"*", function(a,b) return a*b end}
}
local operators_len = #operators
local range_min = 0
local range_max = 10

local questions = {
	function()
		local a = math.random(range_min, range_max)
		local b = math.random(range_min, range_max)
		local o = operators[math.random(operators_len)]
		return "Calculate "..tostring(a)..o[1]..tostring(b), o[2](a,b)
	end,
	function()
		return "Are you a spambot?", "no", {"yes", "no"}
	end,
	function()
		return "Are you a human?", "yes", {"no", "yes"}
	end,
	function()
		return "What is the color of snow?", "white", {"green", "red", "white", "purple", "black"}
	end,
	function()
		return "What is this website called?", "foxcaves", {"kittyCaves", "foxCaves", "foxingFoxes", "meowingKitties"}
	end,
	function()
		local a = math.random(range_min, range_max)
		local b = math.random(range_min, range_max)
		local o = operators[math.random(operators_len)]
		local res, answer
		if math.random() > 0.5 then
			res = o[2](a,b)
			answer = "yes"
		else
			res = math.random(range_min*-2, range_max*range_max)
			if o[2](a,b) == res then
				answer = "yes"
			else
				answer = "no"
			end
		end
		return tostring(a)..o[1]..tostring(b).."="..res..". Correct?", answer, {"yes", "no"}
	end
}
local questions_len = #questions

function generate_captcha()
	local question, result, answers = questions[math.random(questions_len)]()
	answers = answers or nil
	return load_template("doricaptcha", {QUESTION = question, ANSWERS = answers, CHALLENGE = ngx.encode_base64(mkhash(mktimecode(), result))})
end
