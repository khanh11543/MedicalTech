package com.q2k.meditech.entity.enums;

/**
 * How a time slot was created
 */
public enum SlotSource {
    MANUAL,     // Created individually by admin
    BULK,       // Created via bulk create
    TEMPLATE    // Created by applying a template
}
