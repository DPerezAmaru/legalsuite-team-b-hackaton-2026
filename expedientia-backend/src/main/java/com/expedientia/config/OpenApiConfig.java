package com.expedientia.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("ExpedientIA API")
                        .description("""
                                API REST para la gestión inteligente de expedientes judiciales.

                                Permite crear y consultar expedientes mediante lenguaje natural (chat),
                                procesar documentos PDF para extracción automática de datos con IA,
                                y gestionar tareas asociadas a cada expediente.

                                **Modelo de IA:** Gemini 2.0 Flash (Google)
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("LegalSuite Team B")
                                .email("michael.vargas@legalsuitelatam.com"))
                        .license(new License()
                                .name("Hackathon LegalSuite 2026")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local"),
                        new Server().url("http://localhost:8081").description("Docker")
                ))
                .components(new Components());
    }
}
