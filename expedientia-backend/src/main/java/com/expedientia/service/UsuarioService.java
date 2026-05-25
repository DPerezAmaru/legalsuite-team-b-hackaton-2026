package com.expedientia.service;

import com.expedientia.dto.UsuarioDTO;
import com.expedientia.entity.Usuario;
import com.expedientia.exception.AppException;
import com.expedientia.exception.ResourceNotFoundException;
import com.expedientia.repository.UsuarioRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class UsuarioService {

    private final UsuarioRepository usuarioRepo;

    public UsuarioService(UsuarioRepository usuarioRepo) {
        this.usuarioRepo = usuarioRepo;
    }

    public List<UsuarioDTO> listar() {
        return usuarioRepo.findAll().stream().map(this::toDTO).toList();
    }

    public UsuarioDTO obtener(Long id) {
        return toDTO(findById(id));
    }

    @Transactional
    public UsuarioDTO crear(UsuarioDTO dto) {
        Usuario usuario = new Usuario();
        usuario.setNombre(dto.nombre());
        usuario.setEmail(dto.email());
        usuario.setRol(dto.rol());
        try {
            return toDTO(usuarioRepo.save(usuario));
        } catch (DataIntegrityViolationException e) {
            throw new AppException(AppException.Code.DUPLICATE_EMAIL,
                    "Ya existe un usuario con el email '" + dto.email() + "'.");
        }
    }

    @Transactional
    public UsuarioDTO actualizar(Long id, UsuarioDTO dto) {
        Usuario usuario = findById(id);
        if (dto.nombre() != null) usuario.setNombre(dto.nombre());
        if (dto.email() != null) usuario.setEmail(dto.email());
        if (dto.rol() != null) usuario.setRol(dto.rol());
        try {
            return toDTO(usuarioRepo.save(usuario));
        } catch (DataIntegrityViolationException e) {
            throw new AppException(AppException.Code.DUPLICATE_EMAIL,
                    "Ya existe un usuario con el email '" + dto.email() + "'.");
        }
    }

    @Transactional
    public void eliminar(Long id) {
        if (!usuarioRepo.existsById(id)) throw new ResourceNotFoundException("Usuario", id);
        usuarioRepo.deleteById(id);
    }

    private Usuario findById(Long id) {
        return usuarioRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", id));
    }

    private UsuarioDTO toDTO(Usuario u) {
        return new UsuarioDTO(u.getId(), u.getNombre(), u.getEmail(), u.getRol(), u.getCreatedAt());
    }
}
