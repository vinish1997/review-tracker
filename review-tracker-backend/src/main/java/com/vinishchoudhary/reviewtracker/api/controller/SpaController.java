package com.vinishchoudhary.reviewtracker.api.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {
    // Forward known client routes to index.html so browser refresh works
    @GetMapping({ "/dashboard", "/notifications", "/reviews", "/reviews/**", "/lookups", "/archive", "/shared/**" })
    public String forwardClientRoutes() {
        return "forward:/index.html";
    }
}
