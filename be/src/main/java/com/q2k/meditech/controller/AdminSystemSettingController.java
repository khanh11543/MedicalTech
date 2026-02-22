package com.q2k.meditech.controller;

import com.q2k.meditech.dto.SystemSettingDTO;
import com.q2k.meditech.dto.SystemSettingUpdateDTO;
import com.q2k.meditech.service.SystemSettingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/settings")
public class AdminSystemSettingController {

    @Autowired
    private SystemSettingService settingService;

    /**
     * GET /admin/settings - Get all settings (flat list)
     */
    @GetMapping
    public ResponseEntity<List<SystemSettingDTO>> getAllSettings() {
        return ResponseEntity.ok(settingService.getAllSettings());
    }

    /**
     * GET /admin/settings/grouped - Get all settings grouped by section
     */
    @GetMapping("/grouped")
    public ResponseEntity<Map<String, List<SystemSettingDTO>>> getSettingsGrouped() {
        return ResponseEntity.ok(settingService.getSettingsGrouped());
    }

    /**
     * GET /admin/settings/group/{group} - Get settings for a specific group
     */
    @GetMapping("/group/{group}")
    public ResponseEntity<List<SystemSettingDTO>> getSettingsByGroup(@PathVariable String group) {
        return ResponseEntity.ok(settingService.getSettingsByGroup(group));
    }

    /**
     * GET /admin/settings/key/{key} - Get a single setting by key
     */
    @GetMapping("/key/{key}")
    public ResponseEntity<SystemSettingDTO> getSettingByKey(@PathVariable String key) {
        return ResponseEntity.ok(settingService.getSettingByKey(key));
    }

    /**
     * PUT /admin/settings/{id} - Update a single setting
     */
    @PutMapping("/{id}")
    public ResponseEntity<SystemSettingDTO> updateSetting(
            @PathVariable Long id,
            @RequestBody SystemSettingUpdateDTO dto) {
        return ResponseEntity.ok(settingService.updateSetting(id, dto));
    }

    /**
     * PUT /admin/settings/bulk - Bulk update settings
     */
    @PutMapping("/bulk")
    public ResponseEntity<List<SystemSettingDTO>> bulkUpdate(
            @RequestBody List<SystemSettingUpdateDTO> updates) {
        return ResponseEntity.ok(settingService.bulkUpdate(updates));
    }
}
