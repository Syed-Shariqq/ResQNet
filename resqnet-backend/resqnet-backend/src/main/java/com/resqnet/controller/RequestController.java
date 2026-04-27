package com.resqnet.controller;

import com.resqnet.model.Request;
import com.resqnet.model.RequestDTO;
import com.resqnet.service.RequestService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/requests")
@CrossOrigin(origins = "http://localhost:5173")
public class RequestController {

    private final RequestService requestService;

    public RequestController(RequestService requestService) {
        this.requestService = requestService;
    }

    /**
     * POST /api/requests
     * Create a new help request. Returns 201 CREATED with the saved entity.
     */
    @PostMapping
    public ResponseEntity<?> createRequest(@RequestBody RequestDTO dto) {
        try {
            Request saved = requestService.createRequest(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    /**
     * GET /api/requests
     * Return all requests sorted by severity priority then createdAt. Returns 200 OK.
     */
    @GetMapping
    public ResponseEntity<?> getAllRequests() {
        try {
            List<Request> requests = requestService.getAllRequests();
            return ResponseEntity.ok(requests);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    /**
     * PUT /api/requests/{id}/assign?responderName=...
     * Assign an existing request to a responder. Returns 200 OK.
     */
    @PutMapping("/{id}/assign")
    public ResponseEntity<?> assignRequest(
            @PathVariable String id,
            @RequestParam String responderName) {
        try {
            Request updated = requestService.assignRequest(id, responderName);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    /**
     * PUT /api/requests/{id}/resolve
     * Mark an existing request as resolved. Returns 200 OK.
     */
    @PutMapping("/{id}/resolve")
    public ResponseEntity<?> resolveRequest(@PathVariable String id) {
        try {
            Request updated = requestService.resolveRequest(id);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    /**
     * POST /api/requests/sync
     * Sync a batch of offline requests (SMS/radio) that are now coming in via internet.
     * Returns 200 OK with the list of persisted requests.
     */
    @PostMapping("/sync")
    public ResponseEntity<?> syncOfflineRequests(@RequestBody List<RequestDTO> dtos) {
        try {
            List<Request> synced = requestService.syncOfflineRequests(dtos);
            return ResponseEntity.ok(synced);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", ex.getMessage()));
        }
    }
}
