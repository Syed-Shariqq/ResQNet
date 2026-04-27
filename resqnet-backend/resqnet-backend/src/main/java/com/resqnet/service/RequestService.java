package com.resqnet.service;

import com.resqnet.repository.RequestRepository;
import org.springframework.stereotype.Service;

@Service
public class RequestService {

    private final RequestRepository requestRepository;

    public RequestService(RequestRepository requestRepository) {
        this.requestRepository = requestRepository;
    }

    // TODO: implement service methods
}
