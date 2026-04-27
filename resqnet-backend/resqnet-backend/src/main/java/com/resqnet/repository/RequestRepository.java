package com.resqnet.repository;

import com.resqnet.model.Request;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RequestRepository extends JpaRepository<Request, String> {

    List<Request> findAllByOrderByCreatedAtAsc();

    List<Request> findByStatus(String status);

    List<Request> findBySeverity(String severity);
}
