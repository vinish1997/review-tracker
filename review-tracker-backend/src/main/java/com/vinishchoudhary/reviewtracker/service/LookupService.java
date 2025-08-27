package com.vinishchoudhary.reviewtracker.service;

import com.vinishchoudhary.reviewtracker.domain.model.Mediator;
import com.vinishchoudhary.reviewtracker.domain.model.Platform;
import com.vinishchoudhary.reviewtracker.domain.model.Status;
import com.vinishchoudhary.reviewtracker.repository.MediatorRepository;
import com.vinishchoudhary.reviewtracker.repository.PlatformRepository;
import com.vinishchoudhary.reviewtracker.repository.StatusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LookupService {
    private final PlatformRepository platformRepo;
    private final StatusRepository statusRepo;
    private final MediatorRepository mediatorRepo;

    public List<Platform> allPlatforms() {
        return platformRepo.findAll();
    }

    public Platform savePlatform(Platform p) {
        return platformRepo.save(p);
    }

    public List<Status> allStatuses() {
        return statusRepo.findAll();
    }

    public Status saveStatus(Status s) {
        return statusRepo.save(s);
    }

    public List<Mediator> allMediators() {
        return mediatorRepo.findAll();
    }

    public Mediator saveMediator(Mediator m) {
        return mediatorRepo.save(m);
    }
}