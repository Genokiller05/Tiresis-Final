package com.genokiller05.miappmovil.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.genokiller05.miappmovil.data.model.CameraFeed
import com.genokiller05.miappmovil.data.repository.CameraRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class CameraViewModel @Inject constructor(
    private val cameraRepository: CameraRepository
) : ViewModel() {
    private val _cameras = MutableStateFlow<List<CameraFeed>>(emptyList())
    val cameras: StateFlow<List<CameraFeed>> = _cameras.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    fun loadCameras(siteId: String?) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            val data = cameraRepository.fetchCameras(siteId)
            _cameras.value = data

            if (data.isEmpty()) {
                _error.value = "No se encontraron cámaras disponibles."
            }

            _isLoading.value = false
        }
    }
}
