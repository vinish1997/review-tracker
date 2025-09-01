package com.vinishchoudhary.reviewtracker.api.controller;

import com.vinishchoudhary.reviewtracker.domain.model.ViewPreset;
import com.vinishchoudhary.reviewtracker.repository.ViewPresetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/views")
@RequiredArgsConstructor
public class ViewPresetController {
    private final ViewPresetRepository repo;

    @GetMapping
    public List<ViewPreset> all() { return repo.findAll(); }

    @PostMapping
    public ResponseEntity<ViewPreset> save(@RequestBody ViewPreset preset) {
        // If id present, will update; else create
        if (preset.getName() == null || preset.getName().isBlank())
            return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(repo.save(preset));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // --- Sharing ---
    @PostMapping("/{id}/share")
    public ResponseEntity<ViewPreset> share(@PathVariable String id) {
        ViewPreset vp = repo.findById(id).orElseThrow();
        if (vp.getSlug() == null || vp.getSlug().isBlank()) {
            vp.setSlug(generateSlug());
        }
        vp.setShared(true);
        return ResponseEntity.ok(repo.save(vp));
    }

    @PostMapping("/{id}/unshare")
    public ResponseEntity<ViewPreset> unshare(@PathVariable String id) {
        ViewPreset vp = repo.findById(id).orElseThrow();
        vp.setShared(false);
        return ResponseEntity.ok(repo.save(vp));
    }

    record SharedViewDto(String name, Map<String,Object> config) {}

    @GetMapping("/shared/{slug}")
    public ResponseEntity<SharedViewDto> getShared(@PathVariable String slug) {
        ViewPreset vp = repo.findBySlug(slug).orElse(null);
        if (vp == null || vp.getShared() == null || !vp.getShared()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(new SharedViewDto(vp.getName(), vp.getConfig()));
    }

    private static String generateSlug() {
        String raw = UUID.randomUUID().toString().replace("-", "");
        // 10-char slug
        return raw.substring(0, 10);
    }
}
