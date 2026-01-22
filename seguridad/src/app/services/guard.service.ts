import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable({
    providedIn: 'root'
})
export class GuardService {
    private supabase: SupabaseClient;

    constructor(private supabaseService: SupabaseService) {
        this.supabase = this.supabaseService.client;
    }

    /**
     * Obtiene todos los guardias activos desde la vista de Supabase.
     * @returns Una promesa que resuelve a un array de guardias.
     */
    async getGuards(): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('active_guards_view')
            .select('*');

        if (error) {
            console.error('Error fetching guards:', error);
            throw error;
        }
        return data || [];
    }
    
    /**
     * Obtiene un guardia específico por su document_id desde la vista.
     * @param id El document_id del guardia (ej: 'GRD123').
     * @returns Una promesa que resuelve a los datos del guardia.
     */
    async getGuardById(id: string): Promise<any> {
        const { data, error } = await this.supabase
            .from('active_guards_view')
            .select('*')
            .eq('document_id', id)
            .single();

        if (error) {
            console.error(`Error fetching guard with id ${id}:`, error);
            throw error;
        }
        return data;
    }

    /**
     * Actualiza los datos de un perfil de guardia.
     * @param documentId El document_id del guardia a actualizar.
     * @param updateData Un objeto con los campos a actualizar.
     * @returns Una promesa que resuelve a los datos actualizados.
     */
    async updateGuard(documentId: string, updateData: any): Promise<any> {
        const { data, error } = await this.supabase
            .from('profiles')
            .update(updateData)
            .eq('document_id', documentId)
            .select()
            .single();

        if (error) {
            console.error(`Error updating guard with id ${documentId}:`, error);
            throw error;
        }
        return data;
    }


    /**
     * Sube un archivo de imagen al bucket 'evidences' en Supabase Storage.
     * @param file El archivo a subir.
     * @returns Una promesa que resuelve a la URL pública del archivo subido.
     */
    async uploadPhoto(file: File): Promise<string> {
        const filePath = `guard-photos/${Date.now()}_${file.name}`;

        const { error: uploadError } = await this.supabase.storage
            .from('evidences')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Error uploading photo:', uploadError);
            throw uploadError;
        }

        const { data } = this.supabase.storage
            .from('evidences')
            .getPublicUrl(filePath);

        if (!data?.publicUrl) {
            throw new Error('Could not get public URL for uploaded file.');
        }

        return data.publicUrl;
    }

    /**
     * Crea un nuevo perfil de guardia, obtiene los IDs de rol y sitio,
     * y crea la membresía del sitio en una sola operación lógica.
     * @param guardData Los datos del guardia a crear.
     */
    async createGuard(guardData: { full_name: string, document_id: string, photo_url?: string }): Promise<any> {
        // 1. Insertar el perfil en 'public.profiles'
        const { data: profileData, error: profileError } = await this.supabase
            .from('profiles')
            .insert({
                full_name: guardData.full_name,
                document_id: guardData.document_id,
            })
            .select()
            .single();

        if (profileError) {
            console.error('Error creating profile:', profileError);
            throw profileError;
        }

        // 2. Obtener el ID del rol 'guard' y el ID del primer sitio
        const [roleResponse, siteResponse] = await Promise.all([
            this.supabase.from('roles').select('id').eq('code', 'guard').single(),
            this.supabase.from('sites').select('id').limit(1).single()
        ]);

        const { data: role, error: roleError } = roleResponse;
        const { data: site, error: siteError } = siteResponse;

        if (roleError || !role) throw new Error('Could not find role "guard".');
        if (siteError || !site) throw new Error('Could not find any site.');

        // 3. Insertar la membresía en 'public.site_memberships'
        const { error: membershipError } = await this.supabase
            .from('site_memberships')
            .insert({
                user_id: profileData.id,
                role_id: role.id,
                site_id: site.id
            });
            
        if (membershipError) {
            console.error('Error creating site membership:', membershipError);
            throw membershipError;
        }

        return { ...profileData, ...guardData };
    }
}
