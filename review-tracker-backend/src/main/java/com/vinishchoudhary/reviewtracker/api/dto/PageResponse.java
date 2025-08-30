package com.vinishchoudhary.reviewtracker.api.dto;

import java.util.List;

public class PageResponse<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private String sort;
    private String dir;

    public PageResponse() {}

    public PageResponse(List<T> content, int page, int size, long totalElements, int totalPages, String sort, String dir) {
        this.content = content;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.sort = sort;
        this.dir = dir;
    }

    public List<T> getContent() { return content; }
    public int getPage() { return page; }
    public int getSize() { return size; }
    public long getTotalElements() { return totalElements; }
    public int getTotalPages() { return totalPages; }
    public String getSort() { return sort; }
    public String getDir() { return dir; }

    public void setContent(List<T> content) { this.content = content; }
    public void setPage(int page) { this.page = page; }
    public void setSize(int size) { this.size = size; }
    public void setTotalElements(long totalElements) { this.totalElements = totalElements; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }
    public void setSort(String sort) { this.sort = sort; }
    public void setDir(String dir) { this.dir = dir; }
}

