package com.q2k.meditech.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.q2k.meditech.util.XssUtils;

import java.io.IOException;

/**
 * Custom Jackson deserializer that sanitizes all String values in JSON request bodies
 * to prevent XSS attacks via POST/PUT JSON payloads.
 */
public class XssStringDeserializer extends JsonDeserializer<String> {

    @Override
    public String deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String value = p.getValueAsString();
        return XssUtils.stripXss(value);
    }

    @Override
    public Class<String> handledType() {
        return String.class;
    }
}
