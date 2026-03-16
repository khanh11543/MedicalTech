package com.q2k.meditech.util;

import java.util.regex.Pattern;

/**
 * Utility class for XSS (Cross-Site Scripting) prevention.
 * Strips dangerous HTML/JS patterns from user input.
 */
public final class XssUtils {

    private XssUtils() {
    }

    private static final Pattern[] XSS_PATTERNS = {
            // Script fragments
            Pattern.compile("<script>(.*?)</script>", Pattern.CASE_INSENSITIVE),
            Pattern.compile("</script>", Pattern.CASE_INSENSITIVE),
            Pattern.compile("<script(.*?)>", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL),
            // src='...'
            Pattern.compile("src[\r\n]*=[\r\n]*'(.*?)'", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL),
            Pattern.compile("src[\r\n]*=[\r\n]*\"(.*?)\"", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL),
            // eval(...)
            Pattern.compile("eval\\((.*?)\\)", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL),
            // expression(...)
            Pattern.compile("expression\\((.*?)\\)", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL),
            // javascript:
            Pattern.compile("javascript:", Pattern.CASE_INSENSITIVE),
            // vbscript:
            Pattern.compile("vbscript:", Pattern.CASE_INSENSITIVE),
            // onload=
            Pattern.compile("on\\w+\\s*=", Pattern.CASE_INSENSITIVE | Pattern.MULTILINE | Pattern.DOTALL),
    };

    /**
     * Strips known XSS patterns from the input string.
     * Returns null if input is null.
     */
    public static String stripXss(String value) {
        if (value == null) {
            return null;
        }

        // Remove null bytes
        value = value.replaceAll("\0", "");

        // Apply all XSS patterns
        for (Pattern pattern : XSS_PATTERNS) {
            value = pattern.matcher(value).replaceAll("");
        }

        return value;
    }

    /**
     * Escapes HTML special characters to prevent stored XSS.
     */
    public static String escapeHtml(String input) {
        if (input == null) {
            return null;
        }
        return input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#x27;");
    }
}
