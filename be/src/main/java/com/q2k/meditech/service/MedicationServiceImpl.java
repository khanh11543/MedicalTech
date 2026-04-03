package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.Medication;
import com.q2k.meditech.entity.MedicationInventory;
import com.q2k.meditech.entity.MedicationInventoryLog;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.AppException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.MedicationInventoryLogRepository;
import com.q2k.meditech.repository.MedicationInventoryRepository;
import com.q2k.meditech.repository.MedicationRepository;
import com.q2k.meditech.repository.UserRepository;
import com.opencsv.CSVReader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;

import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import java.sql.SQLIntegrityConstraintViolationException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class MedicationServiceImpl implements MedicationService {

    private final MedicationRepository medicationRepository;
    private final MedicationInventoryRepository inventoryRepository;
    private final MedicationInventoryLogRepository inventoryLogRepository;
    private final UserRepository userRepository;

    // ───────────── List / Search ─────────────

    @Override
    @Transactional(readOnly = true)
    public Page<MedicationDTO> getAllMedications(String search, String category,
            Boolean requiresPrescription, Boolean isActive,
            String sortBy, String sortDir, int page, int size) {

        Sort sort = "DESC".equalsIgnoreCase(sortDir)
                ? Sort.by(resolveSort(sortBy)).descending()
                : Sort.by(resolveSort(sortBy)).ascending();

        Specification<Medication> spec = buildSpec(search, category, requiresPrescription, isActive);
        Page<Medication> medications = medicationRepository.findAll(spec, PageRequest.of(page, size, sort));
        return medications.map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public MedicationDTO getMedicationById(Long id) {
        Medication med = findById(id);
        return toDTO(med);
    }

    // ───────────── Create ─────────────

    @Override
    public MedicationDTO createMedication(MedicationCreateDTO dto) {
        log.info("Creating medication (auto code). Requested code: {}", dto.getCode());

        // Always tie to DB: generate code if missing
        // (frontend will call next-code, but backend still guarantees correctness)
        int attempts = 0;
        while (attempts++ < 3) {
            String code = StringUtils.hasText(dto.getCode()) ? dto.getCode().trim() : getNextMedicationCode();

            if (medicationRepository.existsByCode(code)) {
                // If user tried to force a code, reject; otherwise retry generation.
                if (StringUtils.hasText(dto.getCode())) {
                    throw new AppException("Medication code already exists: " + code, HttpStatus.CONFLICT);
                }
                continue;
            }

            Medication med = Medication.builder()
                    .code(code)
                    .name(dto.getName())
                    .genericName(dto.getGenericName())
                    .brandName(dto.getBrandName())
                    .category(dto.getCategory())
                    .dosageForm(dto.getDosageForm())
                    .strength(dto.getStrength())
                    .unit(dto.getUnit())
                    .manufacturer(dto.getManufacturer())
                    .countryOfOrigin(dto.getCountryOfOrigin())
                    .description(dto.getDescription())
                    .sideEffects(dto.getSideEffects())
                    .contraindications(dto.getContraindications())
                    .storageConditions(dto.getStorageConditions())
                    .requiresPrescription(dto.getRequiresPrescription() != null ? dto.getRequiresPrescription() : true)
                    .unitPrice(dto.getUnitPrice())
                    .isActive(true)
                    .build();

            try {
                med = medicationRepository.save(med);

                int initialQty = dto.getInitialQuantity() != null ? dto.getInitialQuantity() : 0;
                MedicationInventory inventory = MedicationInventory.builder()
                        .medication(med)
                        .quantity(initialQty)
                        .lastNote("Initial stock")
                        .build();
                inventoryRepository.save(inventory);

                saveLog(med, "INITIAL", 0, initialQty, "Initial stock");
                log.info("Medication created with ID: {} code: {}", med.getId(), code);
                return toDTO(med);
            } catch (Exception ex) {
                // If unique constraint race, retry auto generation.
                Throwable root = ex.getCause();
                if (!StringUtils.hasText(dto.getCode()) &&
                        (ex instanceof org.springframework.dao.DataIntegrityViolationException
                                || root instanceof SQLIntegrityConstraintViolationException)) {
                    log.warn("Code race on {}. Retrying...", code);
                    continue;
                }
                throw ex;
            }
        }

        throw new AppException("Failed to generate medication code. Please retry.", HttpStatus.CONFLICT);
    }

    // ───────────── Update ─────────────

    @Override
    public MedicationDTO updateMedication(Long id, MedicationUpdateDTO dto) {
        log.info("Updating medication ID: {}", id);
        Medication med = findById(id);

        if (StringUtils.hasText(dto.getName())) med.setName(dto.getName());
        if (dto.getGenericName() != null) med.setGenericName(dto.getGenericName());
        if (dto.getBrandName() != null) med.setBrandName(dto.getBrandName());
        if (dto.getCategory() != null) med.setCategory(dto.getCategory());
        if (dto.getDosageForm() != null) med.setDosageForm(dto.getDosageForm());
        if (dto.getStrength() != null) med.setStrength(dto.getStrength());
        if (dto.getUnit() != null) med.setUnit(dto.getUnit());
        if (dto.getManufacturer() != null) med.setManufacturer(dto.getManufacturer());
        if (dto.getCountryOfOrigin() != null) med.setCountryOfOrigin(dto.getCountryOfOrigin());
        if (dto.getDescription() != null) med.setDescription(dto.getDescription());
        if (dto.getSideEffects() != null) med.setSideEffects(dto.getSideEffects());
        if (dto.getContraindications() != null) med.setContraindications(dto.getContraindications());
        if (dto.getStorageConditions() != null) med.setStorageConditions(dto.getStorageConditions());
        if (dto.getRequiresPrescription() != null) med.setRequiresPrescription(dto.getRequiresPrescription());
        if (dto.getUnitPrice() != null) med.setUnitPrice(dto.getUnitPrice());

        med = medicationRepository.save(med);
        return toDTO(med);
    }

    // ───────────── Inventory ─────────────

    @Override
    public MedicationDTO updateInventory(Long id, InventoryUpdateDTO dto) {
        log.info("Updating inventory for medication ID: {}, type: {}, qty: {}", id, dto.getType(), dto.getQuantity());
        Medication med = findById(id);

        MedicationInventory inventory = inventoryRepository.findByMedicationId(id)
                .orElseGet(() -> {
                    MedicationInventory newInv = MedicationInventory.builder()
                            .medication(med)
                            .quantity(0)
                            .build();
                    return inventoryRepository.save(newInv);
                });

        int current = inventory.getQuantity();
        int newQty;
        String auditAction;

        if ("IMPORT".equalsIgnoreCase(dto.getType())) {
            newQty = current + dto.getQuantity();
            auditAction = "INVENTORY_IMPORT";
        } else if ("EXPORT".equalsIgnoreCase(dto.getType())) {
            newQty = current - dto.getQuantity();
            auditAction = "INVENTORY_EXPORT";
        } else if ("ADJUST".equalsIgnoreCase(dto.getType())) {
            newQty = dto.getQuantity();
            auditAction = "INVENTORY_ADJUST";
        } else {
            throw new AppException("Invalid type. Must be IMPORT, EXPORT, or ADJUST", HttpStatus.BAD_REQUEST);
        }

        if (newQty < 0) {
            throw new AppException("Quantity cannot be negative. Current stock: " + current, HttpStatus.BAD_REQUEST);
        }

        inventory.setQuantity(newQty);
        if (StringUtils.hasText(dto.getNote())) {
            inventory.setLastNote(dto.getNote());
        }
        inventoryRepository.save(inventory);

        // Log the change with audit fields
        saveAuditLog(med, auditAction, current, newQty, dto.getNote(), "MANUAL", null);

        return toDTO(med);
    }

    // ───────────── Status ─────────────

    @Override
    public MedicationDTO toggleStatus(Long id) {
        Medication med = findById(id);
        med.setIsActive(!Boolean.TRUE.equals(med.getIsActive()));
        med = medicationRepository.save(med);
        log.info("Medication ID {} status set to: {}", id, med.getIsActive());
        return toDTO(med);
    }

    // ───────────── Inventory Logs ─────────────

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryLogDTO> getInventoryLogs(Long medicationId, int page, int size) {
        // Validate medication exists
        findById(medicationId);
        return inventoryLogRepository
                .findByMedicationIdOrderByChangedAtDesc(medicationId, PageRequest.of(page, size))
                .map(this::toLogDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public InventorySummaryDTO getInventorySummary() {
        List<Medication> allMeds = medicationRepository.findAll();
        long total = allMeds.size();
        long active = allMeds.stream().filter(m -> Boolean.TRUE.equals(m.getIsActive())).count();

        List<MedicationInventory> allInventory = inventoryRepository.findAll();

        long outOfStock = allInventory.stream().filter(i -> i.getQuantity() == 0).count();
        long lowStock   = allInventory.stream().filter(i -> i.getQuantity() > 0 && i.getQuantity() <= 10).count();
        long inStock    = allInventory.stream().filter(i -> i.getQuantity() > 10).count();
        long totalUnits = allInventory.stream().mapToLong(MedicationInventory::getQuantity).sum();

        return InventorySummaryDTO.builder()
                .totalMedications(total)
                .activeMedications(active)
                .inStockCount(inStock)
                .lowStockCount(lowStock)
                .outOfStockCount(outOfStock)
                .totalUnits(totalUnits)
                .build();
    }

    // ───────────── Import (CSV / Excel) ─────────────

    @Override
    public MedicationImportResultDTO importMedications(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException("File is required", HttpStatus.BAD_REQUEST);
        }

        String originalName = String.valueOf(file.getOriginalFilename());
        String lower = originalName.toLowerCase(Locale.ROOT);

        List<MedicationImportErrorDTO> errors = new ArrayList<>();
        int totalRows = 0;
        int success = 0;
        int created = 0;
        int updated = 0;
        int skipped = 0;

        try {
            List<Map<String, String>> rows;
            if (lower.endsWith(".csv")) {
                rows = parseCsv(file);
            } else if (lower.endsWith(".xlsx")) {
                rows = parseXlsx(file);
            } else {
                throw new AppException("Unsupported file type. Please upload .csv or .xlsx", HttpStatus.BAD_REQUEST);
            }

            totalRows = rows.size();
            for (int i = 0; i < rows.size(); i++) {
                int rowNumber = i + 2; // +1 header, +1 1-based
                Map<String, String> r = rows.get(i);

                String code = norm(r.get("code"));
                String name = norm(r.get("name"));
                if (!StringUtils.hasText(code) || !StringUtils.hasText(name)) {
                    skipped++;
                    errors.add(MedicationImportErrorDTO.builder()
                            .rowNumber(rowNumber)
                            .code(code)
                            .message("Missing required fields: code and name")
                            .build());
                    continue;
                }

                Boolean requiresRx = parseBooleanNullable(r.get("requiresPrescription"));
                BigDecimal unitPrice = parseBigDecimalNullable(r.get("unitPrice"));
                Integer initialQuantity = parseIntNullable(r.get("initialQuantity"));
                if (initialQuantity != null && initialQuantity < 0) {
                    skipped++;
                    errors.add(MedicationImportErrorDTO.builder()
                            .rowNumber(rowNumber)
                            .code(code)
                            .message("initialQuantity must be >= 0")
                            .build());
                    continue;
                }

                try {
                    Optional<Medication> existingOpt = medicationRepository.findByCode(code);
                    if (existingOpt.isPresent()) {
                        Medication existing = existingOpt.get();
                        applyUpsert(existing, r, name, requiresRx, unitPrice);
                        medicationRepository.save(existing);
                        updated++;
                        success++;
                    } else {
                        Medication med = Medication.builder()
                                .code(code)
                                .name(name)
                                .genericName(emptyToNull(r.get("genericName")))
                                .brandName(emptyToNull(r.get("brandName")))
                                .category(emptyToNull(r.get("category")))
                                .dosageForm(emptyToNull(r.get("dosageForm")))
                                .strength(emptyToNull(r.get("strength")))
                                .unit(emptyToNull(r.get("unit")))
                                .manufacturer(emptyToNull(r.get("manufacturer")))
                                .countryOfOrigin(emptyToNull(r.get("countryOfOrigin")))
                                .description(emptyToNull(r.get("description")))
                                .sideEffects(emptyToNull(r.get("sideEffects")))
                                .contraindications(emptyToNull(r.get("contraindications")))
                                .storageConditions(emptyToNull(r.get("storageConditions")))
                                .requiresPrescription(requiresRx != null ? requiresRx : true)
                                .unitPrice(unitPrice)
                                .isActive(true)
                                .build();
                        med = medicationRepository.save(med);

                        int initQty = initialQuantity != null ? initialQuantity : 0;
                        MedicationInventory inventory = MedicationInventory.builder()
                                .medication(med)
                                .quantity(initQty)
                                .lastNote("Initial stock (import)")
                                .build();
                        inventoryRepository.save(inventory);
                        saveLog(med, "IMPORT_INITIAL", 0, initQty, "Initial stock (import)");

                        created++;
                        success++;
                    }
                } catch (AppException ae) {
                    skipped++;
                    errors.add(MedicationImportErrorDTO.builder()
                            .rowNumber(rowNumber)
                            .code(code)
                            .message(ae.getMessage())
                            .build());
                } catch (Exception ex) {
                    skipped++;
                    errors.add(MedicationImportErrorDTO.builder()
                            .rowNumber(rowNumber)
                            .code(code)
                            .message("Unexpected error: " + ex.getMessage())
                            .build());
                }
            }

            return MedicationImportResultDTO.builder()
                    .totalRows(totalRows)
                    .successCount(success)
                    .createdCount(created)
                    .updatedCount(updated)
                    .skippedCount(skipped)
                    .errors(errors)
                    .build();
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException("Failed to import file: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    // ───────────── Doctor Search ─────────────

    @Override
    @Transactional(readOnly = true)
    public Page<MedicationDTO> searchForDoctor(String search, int page, int size) {
        Specification<Medication> spec = buildSpec(search, null, null, true);
        return medicationRepository.findAll(spec, PageRequest.of(page, size, Sort.by("name").ascending()))
                .map(this::toDTO);
    }

    // ───────────── Helpers ─────────────

    private Medication findById(Long id) {
        return medicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medication", "id", id));
    }

    private MedicationDTO toDTO(Medication med) {
        Integer qty = inventoryRepository.findByMedicationId(med.getId())
                .map(MedicationInventory::getQuantity)
                .orElse(0);

        return MedicationDTO.builder()
                .id(med.getId())
                .code(med.getCode())
                .name(med.getName())
                .genericName(med.getGenericName())
                .brandName(med.getBrandName())
                .category(med.getCategory())
                .dosageForm(med.getDosageForm())
                .strength(med.getStrength())
                .unit(med.getUnit())
                .manufacturer(med.getManufacturer())
                .countryOfOrigin(med.getCountryOfOrigin())
                .description(med.getDescription())
                .sideEffects(med.getSideEffects())
                .contraindications(med.getContraindications())
                .storageConditions(med.getStorageConditions())
                .requiresPrescription(med.getRequiresPrescription())
                .unitPrice(med.getUnitPrice())
                .isActive(med.getIsActive())
                .availableQuantity(qty)
                .createdAt(med.getCreatedAt())
                .updatedAt(med.getUpdatedAt())
                .build();
    }

    private Specification<Medication> buildSpec(String search, String category,
            Boolean requiresPrescription, Boolean isActive) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(search)) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(cb.lower(root.get("code")), pattern),
                        cb.like(cb.lower(root.get("genericName")), pattern)
                ));
            }
            if (StringUtils.hasText(category)) {
                predicates.add(cb.equal(cb.lower(root.get("category")), category.toLowerCase()));
            }
            if (requiresPrescription != null) {
                predicates.add(cb.equal(root.get("requiresPrescription"), requiresPrescription));
            }
            if (isActive != null) {
                predicates.add(cb.equal(root.get("isActive"), isActive));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private void saveLog(Medication med, String type, int before, int after, String note) {
        saveAuditLog(med, type, before, after, note, null, null);
    }

    private void saveAuditLog(Medication med, String type, int before, int after,
                              String note, String referenceType, Long referenceId) {
        User currentUser = getCurrentUser();
        HttpServletRequest request = getCurrentRequest();

        MedicationInventoryLog logEntry = MedicationInventoryLog.builder()
                .medication(med)
                .type(type)
                .quantityBefore(before)
                .quantityAfter(after)
                .delta(after - before)
                .note(note)
                .user(currentUser)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .ipAddress(request != null ? getClientIp(request) : null)
                .userAgent(request != null ? request.getHeader("User-Agent") : null)
                .changedAt(LocalDateTime.now())
                .build();
        inventoryLogRepository.save(logEntry);
    }

    private User getCurrentUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                String email = auth.getName();
                return userRepository.findByEmail(email).orElse(null);
            }
        } catch (Exception e) {
            log.debug("Could not resolve current user for audit log: {}", e.getMessage());
        }
        return null;
    }

    private HttpServletRequest getCurrentRequest() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            return attrs != null ? attrs.getRequest() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private InventoryLogDTO toLogDTO(MedicationInventoryLog logEntry) {
        InventoryLogDTO.InventoryLogDTOBuilder builder = InventoryLogDTO.builder()
                .id(logEntry.getId())
                .medicationId(logEntry.getMedication().getId())
                .medicationName(logEntry.getMedication().getName())
                .medicationCode(logEntry.getMedication().getCode())
                .type(logEntry.getType())
                .quantityBefore(logEntry.getQuantityBefore())
                .quantityAfter(logEntry.getQuantityAfter())
                .delta(logEntry.getDelta())
                .note(logEntry.getNote())
                .changedAt(logEntry.getChangedAt())
                .referenceType(logEntry.getReferenceType())
                .referenceId(logEntry.getReferenceId())
                .ipAddress(logEntry.getIpAddress())
                .userAgent(logEntry.getUserAgent());

        if (logEntry.getUser() != null) {
            builder.userId(logEntry.getUser().getId());
            builder.userName(logEntry.getUser().getFullName());
        }

        return builder.build();
    }

    private String resolveSort(String sortBy) {
        return switch (sortBy == null ? "" : sortBy) {
            case "price", "unitPrice" -> "unitPrice";
            case "code" -> "code";
            case "category" -> "category";
            default -> "name";
        };
    }

    @Override
    @Transactional(readOnly = true)
    public String getNextMedicationCode() {
        long max = 0L;
        try {
            Long v = medicationRepository.findMaxMedicationCodeNumber();
            if (v != null) max = v;
        } catch (Exception ignored) {
            // If there are legacy codes not matching MED####, ignore and start from 1
        }
        long next = max + 1;
        return "MED" + String.format("%04d", next);
    }

    private List<Map<String, String>> parseCsv(MultipartFile file) throws Exception {
        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String[] headers = reader.readNext();
            if (headers == null || headers.length == 0) {
                throw new AppException("CSV header row is required", HttpStatus.BAD_REQUEST);
            }

            Map<Integer, String> idxToKey = new HashMap<>();
            for (int i = 0; i < headers.length; i++) {
                String k = normalizeHeader(headers[i]);
                if (StringUtils.hasText(k)) idxToKey.put(i, k);
            }

            if (!idxToKey.containsValue("code") || !idxToKey.containsValue("name")) {
                throw new AppException("CSV must include 'code' and 'name' columns", HttpStatus.BAD_REQUEST);
            }

            List<Map<String, String>> rows = new ArrayList<>();
            String[] line;
            while ((line = reader.readNext()) != null) {
                boolean allEmpty = true;
                Map<String, String> row = new HashMap<>();
                for (int i = 0; i < line.length; i++) {
                    String key = idxToKey.get(i);
                    if (key == null) continue;
                    String val = line[i];
                    if (StringUtils.hasText(val)) allEmpty = false;
                    row.put(key, val);
                }
                if (!allEmpty) rows.add(row);
            }
            return rows;
        }
    }

    private List<Map<String, String>> parseXlsx(MultipartFile file) throws Exception {
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            if (sheet == null) {
                throw new AppException("Excel file must contain at least 1 sheet", HttpStatus.BAD_REQUEST);
            }

            Row headerRow = sheet.getRow(sheet.getFirstRowNum());
            if (headerRow == null) {
                throw new AppException("Excel header row is required", HttpStatus.BAD_REQUEST);
            }

            Map<Integer, String> idxToKey = new HashMap<>();
            DataFormatter formatter = new DataFormatter();
            for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                Cell cell = headerRow.getCell(i);
                String k = normalizeHeader(cell != null ? formatter.formatCellValue(cell) : null);
                if (StringUtils.hasText(k)) idxToKey.put(i, k);
            }

            if (!idxToKey.containsValue("code") || !idxToKey.containsValue("name")) {
                throw new AppException("Excel must include 'code' and 'name' columns", HttpStatus.BAD_REQUEST);
            }

            List<Map<String, String>> rows = new ArrayList<>();
            int firstDataRow = headerRow.getRowNum() + 1;
            int lastRow = sheet.getLastRowNum();
            for (int r = firstDataRow; r <= lastRow; r++) {
                Row rowObj = sheet.getRow(r);
                if (rowObj == null) continue;

                boolean allEmpty = true;
                Map<String, String> row = new HashMap<>();
                for (Map.Entry<Integer, String> e : idxToKey.entrySet()) {
                    Cell cell = rowObj.getCell(e.getKey());
                    String val = cell != null ? formatter.formatCellValue(cell) : null;
                    if (StringUtils.hasText(val)) allEmpty = false;
                    row.put(e.getValue(), val);
                }
                if (!allEmpty) rows.add(row);
            }
            return rows;
        }
    }

    private String normalizeHeader(String raw) {
        String h = norm(raw);
        if (!StringUtils.hasText(h)) return null;
        h = h.replace("\uFEFF", ""); // BOM
        h = h.replace(" ", "");
        h = h.replace("_", "");
        h = h.replace("-", "");
        return h.toLowerCase(Locale.ROOT);
    }

    private String norm(String s) {
        return s == null ? "" : s.trim();
    }

    private String emptyToNull(String s) {
        String v = norm(s);
        return StringUtils.hasText(v) ? v : null;
    }

    private Boolean parseBooleanNullable(String raw) {
        String v = norm(raw).toLowerCase(Locale.ROOT);
        if (!StringUtils.hasText(v)) return null;
        return v.equals("true") || v.equals("1") || v.equals("yes") || v.equals("y");
    }

    private Integer parseIntNullable(String raw) {
        String v = norm(raw);
        if (!StringUtils.hasText(v)) return null;
        try {
            return Integer.parseInt(v);
        } catch (Exception e) {
            return null;
        }
    }

    private BigDecimal parseBigDecimalNullable(String raw) {
        String v = norm(raw);
        if (!StringUtils.hasText(v)) return null;
        try {
            v = v.replace(",", "");
            return new BigDecimal(v);
        } catch (Exception e) {
            return null;
        }
    }

    private void applyUpsert(Medication med, Map<String, String> r, String name, Boolean requiresRx, BigDecimal unitPrice) {
        med.setName(name);
        med.setGenericName(emptyToNull(r.get("genericName")));
        med.setBrandName(emptyToNull(r.get("brandName")));
        med.setCategory(emptyToNull(r.get("category")));
        med.setDosageForm(emptyToNull(r.get("dosageForm")));
        med.setStrength(emptyToNull(r.get("strength")));
        med.setUnit(emptyToNull(r.get("unit")));
        med.setManufacturer(emptyToNull(r.get("manufacturer")));
        med.setCountryOfOrigin(emptyToNull(r.get("countryOfOrigin")));
        med.setDescription(emptyToNull(r.get("description")));
        med.setSideEffects(emptyToNull(r.get("sideEffects")));
        med.setContraindications(emptyToNull(r.get("contraindications")));
        med.setStorageConditions(emptyToNull(r.get("storageConditions")));
        if (requiresRx != null) med.setRequiresPrescription(requiresRx);
        if (unitPrice != null) med.setUnitPrice(unitPrice);
    }
}
