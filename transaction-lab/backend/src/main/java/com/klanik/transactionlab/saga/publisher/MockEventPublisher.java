package com.klanik.transactionlab.saga.publisher;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("local")
public class MockEventPublisher implements EventPublisher {
    @Override
    public void publish(String topic, String key, Object event) {
        log.info("[KAFKA-MOCK] topic={} key={} payload={}", topic, key, event);
    }
}
