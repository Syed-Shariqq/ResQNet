package com.resqnet.service;

import com.resqnet.model.Request;
import com.resqnet.model.RequestDTO;
import com.resqnet.repository.RequestRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
public class RequestService {

    private final RequestRepository requestRepository;

    // Severity sort order: lower number = higher priority
    private static final Map<String, Integer> SEVERITY_ORDER = Map.of(
            "critical", 0,
            "high",     1,
            "medium",   2,
            "low",      3
    );

    public RequestService(RequestRepository requestRepository) {
        this.requestRepository = requestRepository;
    }

    /**
     * Creates a new Request from a DTO.
     * Internet-channel requests are marked as synced immediately.
     */
    public Request createRequest(RequestDTO dto) {
        Request request = Request.builder()
                .description(dto.getDescription())
                .location(dto.getLocation())
                .severity(dto.getSeverity())
                .category(dto.getCategory())
                .smsPayload(dto.getSmsPayload())
                .status("pending")
                .channelUsed(dto.getChannelUsed())
                .build();

        if ("internet".equals(dto.getChannelUsed())) {
            request.setSyncedAt(LocalDateTime.now());
        }

        return requestRepository.save(request);
    }

    /**
     * Returns all requests sorted by severity priority (critical → low),
     * then by createdAt ascending within the same severity level.
     */
    public List<Request> getAllRequests() {
        List<Request> requests = requestRepository.findAll();

        requests.sort(Comparator
                .comparingInt((Request r) ->
                        SEVERITY_ORDER.getOrDefault(
                                r.getSeverity() != null ? r.getSeverity().toLowerCase() : "",
                                Integer.MAX_VALUE))
                .thenComparing(Request::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
        );

        return requests;
    }

    /**
     * Assigns an existing request to a responder by name.
     */
    public Request assignRequest(String id, String responderName) {
        Request request = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        request.setStatus("assigned");
        request.setAssignedTo(responderName);

        return requestRepository.save(request);
    }

    /**
     * Marks an existing request as resolved.
     */
    public Request resolveRequest(String id) {
        Request request = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        request.setStatus("resolved");

        return requestRepository.save(request);
    }

    /**
     * Syncs a batch of offline (SMS/radio) requests into the system via internet.
     * Each DTO is re-tagged as channelUsed="internet" and given a syncedAt timestamp.
     */
    public List<Request> syncOfflineRequests(List<RequestDTO> dtos) {
        return dtos.stream()
                .map(dto -> {
                    dto.setChannelUsed("internet");
                    return createRequest(dto);
                })
                .toList();
    }
}
