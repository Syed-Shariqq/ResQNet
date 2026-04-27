package com.resqnet.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RequestDTO {

    private String description;
    private String location;
    private String severity;
    private String category;
    private String smsPayload;
    private String status;
    private String channelUsed;
}
