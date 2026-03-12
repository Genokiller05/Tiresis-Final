package com.genokiller05.miappmovil.di

import com.genokiller05.miappmovil.data.repository.DataRepository
import com.genokiller05.miappmovil.data.repository.NotificationRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideDataRepository(): DataRepository = DataRepository()

    @Provides
    @Singleton
    fun provideNotificationRepository(): NotificationRepository = NotificationRepository()
}
