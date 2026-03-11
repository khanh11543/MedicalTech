package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewListResponse {
    private List<ReviewDTO> reviews;
    private int totalPages;
    private long totalElements;
    private int currentPage;
    private int pageSize;
}
