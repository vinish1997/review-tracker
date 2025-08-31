package com.vinishchoudhary.reviewtracker.api.controller;

import com.vinishchoudhary.reviewtracker.domain.model.*;
import com.vinishchoudhary.reviewtracker.api.dto.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import com.vinishchoudhary.reviewtracker.service.LookupService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lookups")
@RequiredArgsConstructor
public class LookupController {
    private final LookupService lookupService;

    @GetMapping("/platforms")
    public PageResponse<Platform> platforms(@RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "10") int size,
                                            @RequestParam(defaultValue = "name") String sort,
                                            @RequestParam(defaultValue = "ASC") String dir) {
        Sort.Direction direction = "ASC".equalsIgnoreCase(dir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Page<Platform> res = lookupService.allPlatforms(PageRequest.of(page, size, Sort.by(direction, sort)));
        return new PageResponse<>(res.getContent(), res.getNumber(), res.getSize(), res.getTotalElements(), res.getTotalPages(), sort, dir);
    }

    @PostMapping("/platforms")
    public Platform savePlatform(@RequestBody Platform p) {
        return lookupService.savePlatform(p);
    }


    // Status lookups removed — status is computed and static now

    @GetMapping("/mediators")
    public PageResponse<Mediator> mediators(@RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "10") int size,
                                            @RequestParam(defaultValue = "name") String sort,
                                            @RequestParam(defaultValue = "ASC") String dir) {
        Sort.Direction direction = "ASC".equalsIgnoreCase(dir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Page<Mediator> res = lookupService.allMediators(PageRequest.of(page, size, Sort.by(direction, sort)));
        return new PageResponse<>(res.getContent(), res.getNumber(), res.getSize(), res.getTotalElements(), res.getTotalPages(), sort, dir);
    }

    @PostMapping("/mediators")
    public Mediator saveMediator(@RequestBody Mediator m) {
        return lookupService.saveMediator(m);
    }

    @DeleteMapping("/platforms/{id}")
    public void deletePlatform(@PathVariable String id) { lookupService.deletePlatform(id); }

    // Status deletion removed

    @DeleteMapping("/mediators/{id}")
    public void deleteMediator(@PathVariable String id) { lookupService.deleteMediator(id); }
}
