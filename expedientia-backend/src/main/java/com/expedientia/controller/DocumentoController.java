package com.expedientia.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/documentos")
public class DocumentoController {

    @GetMapping("Hola")
    public String saludar() {
        return "¡Hola, Mundo!";
    }
}
