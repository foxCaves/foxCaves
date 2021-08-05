ENVIRONMENT = os.getenv("ENVIRONMENT") or "development"
IS_PRODUCTION = (ENVIRONMENT == "production")

local rex = require("rex_pcre")

local preprocessTemplate

local function getVersion()
	local fh = io.open("../.revision", "r")
	if not fh then
		error("Missing .revision file!")
	end
	local ret = fh:read("*all")
	fh:close()
	return ret:gsub("%s+", "")
end

local function loadTemplateFile(name, insideother)
	local file = io.open("templates/"..name..".tpl")
	if not file then
		error("Could not open template: " .. name)
	end
	local code = file:read("*all")
	file:close()

	code = preprocessTemplate(code, insideother)

	if IS_PRODUCTION then
		code = rex.gsub(code, "<!--(.*?)-->", "", nil)
		code = rex.gsub(code, "(?>[^\\S ]\\s*| \\s{2,})(?=[^<]*+(?:<(?!/?(?:textarea|script|pre)\\b)[^<]*+)*+(?:<(?>textarea|script|pre)\\b| \\z))", " ", nil, "ix")
		--code = rex.gsub(code, "^[\r\n\t ]+", "")
		--code = rex.gsub(code, "[\r\n\t ]+$", "")
	end

	return code
end

function preprocessTemplate(code, insideother)
	local startPos
	local endPos = 0
	local match
	local marker
	local lastCut = 1
	local concatTbl
	if insideother then
		concatTbl = {}
	else
		concatTbl = {"return function() local retTbl = {}"}
	end

	while true do
		startPos, endPos, marker, match = string.find(code, "<%%([#=+]?)%s*(.-)%s*%%>", endPos+1)
		if(not startPos) then
			break
		end

		local codeBlock = code:sub(lastCut, startPos-1)
		if codeBlock ~= "" then
			table.insert(concatTbl, "tinsert(retTbl, [["..codeBlock.."]])")
		end

		if(match ~= "") then
			if(marker == "=") then
				table.insert(concatTbl, "tinsert(retTbl, "..match..")")
			elseif(marker == "+") then
				table.insert(concatTbl, loadTemplateFile(match, true))
			elseif(marker == "#") then
				table.insert(concatTbl, 'tinsert(retTbl, "' .. loadstring("return " .. match)() .. '")')
			else
				table.insert(concatTbl, match)
			end
		end
		lastCut = endPos+1
	end
	if(lastCut == 1 and not insideother) then return "return [["..code.."]]" end
	local codeBlock = code:sub(lastCut, code:len())
	if codeBlock ~= "" then
		table.insert(concatTbl, "tinsert(retTbl, [["..codeBlock.."]])")
	end
	if not insideother then table.insert(concatTbl, "return tconcat(retTbl) end") end
	return table.concat(concatTbl, "\n")
end

local function loadTemplate(name)
	local code = loadTemplateFile(name, false)
	local func, err = load(code, "TEMPLATE:"..name)
	if(not func) then
		error(
			string.format(
				"Failed to compile template %s : %s",
				name,
				err
			)
		)
	end
	return func
end

function evalTemplate(name, params)
	local tpl = loadTemplate(name)()
	if type(tpl) == "string" then
		return tpl
	end

	if not params then params = {} end

	params.pairs = pairs
	params.ipairs = ipairs
	params.next = next
	params.tostring = tostring
	params.tinsert = table.insert
	params.tconcat = table.concat
	params.SHORT_URL = SHORT_URL
	params.MAIN_URL = MAIN_URL
	params.G = _G
	params.VERSION = getVersion()

	return setfenv(tpl, params)()
end
