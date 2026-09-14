package com.patred.planner.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.patred.planner.domain.Role;

import java.io.IOException;

public class RoleKeySerializer extends JsonSerializer<Role> {

    @Override
    public void serialize(Role role, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        if (role != null && role.getDescription() != null) {
            gen.writeFieldName(role.getDescription());
        } else {
            gen.writeFieldName("");
        }
    }
}