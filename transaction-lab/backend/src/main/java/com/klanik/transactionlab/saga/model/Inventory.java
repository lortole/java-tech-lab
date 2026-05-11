package com.klanik.transactionlab.saga.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "inventory")
@Getter @Setter @NoArgsConstructor
public class Inventory {

    @Id
    @Column(name = "product_id")
    private String productId;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(nullable = false)
    private int stock;

    @Column(nullable = false)
    private int reserved;

    public int getAvailableStock() {
        return stock - reserved;
    }

    public void reserve(int qty) {
        if (getAvailableStock() < qty)
            throw new IllegalStateException("Stock insuffisant");
        this.reserved += qty;
    }

    public void release(int qty) {
        this.reserved = Math.max(0, this.reserved - qty);
    }
}