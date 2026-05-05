package dev.lortole.netflixjava2026.testslices;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * TP — Test Slice : @WebMvcTest
 *
 * Ce que Netflix a appris (et nous aussi) :
 * - @SpringBootTest charge le contexte Spring complet → lent (2-10s selon le projet)
 * - @WebMvcTest charge UNIQUEMENT la couche Web (Controllers, Filters, Security)
 *   Le Service est mocké → test isolé, rapide (< 500ms)
 *
 * Pattern directement applicable en mission : remplacer les @SpringBootTest
 * qui testent un Controller par des @WebMvcTest avec @MockBean sur les Services.
 */
@WebMvcTest(TrackController.class)
@DisplayName("TP Test Slices — @WebMvcTest vs @SpringBootTest")
class TrackControllerWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    // Le Service n'est PAS démarré — juste mocké
    // C'est toute la différence avec @SpringBootTest
    @MockBean
    private TrackService trackService;

    @Test
    @WithMockUser
    @DisplayName("GET /api/tracks/{id} → 200 avec le bon body — contexte Spring Web uniquement")
    void shouldReturnTrackWhenExists() throws Exception {
        // GIVEN
        when(trackService.findById(1L))
                .thenReturn(new TrackDto(1L, "Murderer", "Barrington Levy"));

        // WHEN / THEN
        mockMvc.perform(get("/api/tracks/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Murderer"))
                .andExpect(jsonPath("$.artist").value("Barrington Levy"));

        // Ce test tourne en < 500ms.
        // Le même test avec @SpringBootTest prendrait 3-8s selon les dépendances chargées.
        // Sur 50 tests Controller dans un projet moyen : économie de 2-5 minutes par build.
    }

    @Test
    @DisplayName("GET /api/tracks/{id} sans auth → 401 — Spring Security chargé dans le slice")
    void shouldReturn401WhenNotAuthenticated() throws Exception {
        // La sécurité est bien active dans @WebMvcTest — contrairement à ce qu'on pourrait croire
        mockMvc.perform(get("/api/tracks/1"))
                .andExpect(status().isUnauthorized());
    }
}