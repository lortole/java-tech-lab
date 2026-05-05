package dev.lowx.netflixjava2026.testslices;

import org.springframework.stereotype.Service;

@Service
public class TrackService {

    public TrackDto findById(Long id) {
        // Simule un appel base — dans un vrai projet ça ferait appel au repo JPA
        return new TrackDto(id, "Murderer", "Barrington Levy");
    }
}