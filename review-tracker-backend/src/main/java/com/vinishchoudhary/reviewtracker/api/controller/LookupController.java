package com.vinishchoudhary.reviewtracker.api.controller;

import com.vinishchoudhary.reviewtracker.domain.model.*;
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
    public List<Platform> platforms() {
        return lookupService.allPlatforms();
    }

    @PostMapping("/platforms")
    public Platform savePlatform(@RequestBody Platform p) {
        return lookupService.savePlatform(p);
    }

    @GetMapping("/statuses")
    public List<Status> statuses() {
        return lookupService.allStatuses();
    }

    @PostMapping("/statuses")
    public Status saveStatus(@RequestBody Status s) {
        return lookupService.saveStatus(s);
    }

    @GetMapping("/mediators")
    public List<Mediator> mediators() {
        return lookupService.allMediators();
    }

    @PostMapping("/mediators")
    public Mediator saveMediator(@RequestBody Mediator m) {
        return lookupService.saveMediator(m);
    }
}