package com.vinishchoudhary.reviewtracker.service;

import com.vinishchoudhary.reviewtracker.domain.model.Mediator;
import com.vinishchoudhary.reviewtracker.domain.model.Platform;
import com.vinishchoudhary.reviewtracker.repository.MediatorRepository;
import com.vinishchoudhary.reviewtracker.repository.PlatformRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LookupService {
    private final PlatformRepository platformRepo;
    private final MediatorRepository mediatorRepo;

    public Page<Platform> allPlatforms(Pageable pageable) { return platformRepo.findAll(pageable); }

    public Platform savePlatform(Platform p) {
        return platformRepo.save(p);
    }

    // Status lookups removed — status is computed and static

    public Page<Mediator> allMediators(Pageable pageable) { return mediatorRepo.findAll(pageable); }

    public Mediator saveMediator(Mediator m) {
        return mediatorRepo.save(m);
    }

    public void deletePlatform(String id) { platformRepo.deleteById(id); }
    public void deleteMediator(String id) { mediatorRepo.deleteById(id); }
}
