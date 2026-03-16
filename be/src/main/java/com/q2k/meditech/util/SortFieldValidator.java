package com.q2k.meditech.util;

import java.util.Set;

/**
 * Validates sortBy fields from user input to prevent information disclosure
 * and invalid property reference errors.
 */
public final class SortFieldValidator {

    private SortFieldValidator() {}

    /**
     * Validates sortBy against a set of allowed fields.
     * Returns defaultField if sortBy is null, empty, or not in the allowed set.
     */
    public static String validate(String sortBy, Set<String> allowedFields, String defaultField) {
        if (sortBy == null || sortBy.isEmpty() || !allowedFields.contains(sortBy)) {
            return defaultField;
        }
        return sortBy;
    }
}
