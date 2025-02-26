import {
    APP_INITIALIZER,
    LOCALE_ID,
    NgModule,
} from '@angular/core';

import { ToasterModule } from 'angular2-toaster';

import { LaunchGuardService } from './launch-guard.service';

import { AuthGuardService } from '@bytegarden/jslib/src/angular/services/auth-guard.service';
import { BroadcasterService } from '@bytegarden/jslib/src/angular/services/broadcaster.service';
import { ValidationService } from '@bytegarden/jslib/src/angular/services/validation.service';

import { BrowserApi } from '../../browser/browserApi';

import { ApiService } from '@bytegarden/jslib/src/abstractions/api.service';
import { AppIdService } from '@bytegarden/jslib/src/abstractions/appId.service';
import { AuditService } from '@bytegarden/jslib/src/abstractions/audit.service';
import { AuthService as AuthServiceAbstraction } from '@bytegarden/jslib/src/abstractions/auth.service';
import { CipherService } from '@bytegarden/jslib/src/abstractions/cipher.service';
import { CollectionService } from '@bytegarden/jslib/src/abstractions/collection.service';
import { CryptoService } from '@bytegarden/jslib/src/abstractions/crypto.service';
import { EnvironmentService } from '@bytegarden/jslib/src/abstractions/environment.service';
import { EventService } from '@bytegarden/jslib/src/abstractions/event.service';
import { ExportService } from '@bytegarden/jslib/src/abstractions/export.service';
import { FolderService } from '@bytegarden/jslib/src/abstractions/folder.service';
import { I18nService } from '@bytegarden/jslib/src/abstractions/i18n.service';
import { LockService } from '@bytegarden/jslib/src/abstractions/lock.service';
import { MessagingService } from '@bytegarden/jslib/src/abstractions/messaging.service';
import { NotificationsService } from '@bytegarden/jslib/src/abstractions/notifications.service';
import { PasswordGenerationService } from '@bytegarden/jslib/src/abstractions/passwordGeneration.service';
import { PlatformUtilsService } from '@bytegarden/jslib/src/abstractions/platformUtils.service';
import { SearchService as SearchServiceAbstraction } from '@bytegarden/jslib/src/abstractions/search.service';
import { SettingsService } from '@bytegarden/jslib/src/abstractions/settings.service';
import { StateService as StateServiceAbstraction } from '@bytegarden/jslib/src/abstractions/state.service';
import { StorageService } from '@bytegarden/jslib/src/abstractions/storage.service';
import { SyncService } from '@bytegarden/jslib/src/abstractions/sync.service';
import { TokenService } from '@bytegarden/jslib/src/abstractions/token.service';
import { TotpService } from '@bytegarden/jslib/src/abstractions/totp.service';
import { UserService } from '@bytegarden/jslib/src/abstractions/user.service';

import { AutofillService } from '../../services/abstractions/autofill.service';
import BrowserMessagingService from '../../services/browserMessaging.service';

import { AuthService } from '@bytegarden/jslib/src/services/auth.service';
import { ConstantsService } from '@bytegarden/jslib/src/services/constants.service';
import { SearchService } from '@bytegarden/jslib/src/services/search.service';
import { StateService } from '@bytegarden/jslib/src/services/state.service';

import { Analytics } from '@bytegarden/jslib/src/misc/analytics';

import { PopupSearchService } from './popup-search.service';
import { PopupUtilsService } from './popup-utils.service';

function getBgService<T>(service: string) {
    return (): T => {
        const page = BrowserApi.getBackgroundPage();
        return page ? page.bytegardenMain[service] as T : null;
    };
}

export const stateService = new StateService();
export const messagingService = new BrowserMessagingService();
export const authService = new AuthService(getBgService<CryptoService>('cryptoService')(),
    getBgService<ApiService>('apiService')(), getBgService<UserService>('userService')(),
    getBgService<TokenService>('tokenService')(), getBgService<AppIdService>('appIdService')(),
    getBgService<I18nService>('i18nService')(), getBgService<PlatformUtilsService>('platformUtilsService')(),
    messagingService);
export const searchService = new PopupSearchService(getBgService<SearchService>('searchService')(),
    getBgService<CipherService>('cipherService')(), getBgService<PlatformUtilsService>('platformUtilsService')());

export function initFactory(i18nService: I18nService, storageService: StorageService,
    popupUtilsService: PopupUtilsService): Function {
    return async () => {
        if (!popupUtilsService.inPopup(window)) {
            window.document.body.classList.add('body-full');
        } else if (window.screen.availHeight < 600) {
            window.document.body.classList.add('body-xs');
        } else if (window.screen.availHeight <= 800) {
            window.document.body.classList.add('body-sm');
        }

        if (BrowserApi.getBackgroundPage() != null) {
            stateService.save(ConstantsService.disableFaviconKey,
                await storageService.get<boolean>(ConstantsService.disableFaviconKey));

            let theme = await storageService.get<string>(ConstantsService.themeKey);
            if (theme == null) {
                theme = 'light';
            }
            window.document.documentElement.classList.add('locale_' + i18nService.translationLocale);
            window.document.documentElement.classList.add('theme_' + theme);

            authService.init();

            const analytics = new Analytics(window, () => BrowserApi.gaFilter(), null, null, null, () => {
                const bgPage = BrowserApi.getBackgroundPage();
                if (bgPage == null || bgPage.bytegardenMain == null) {
                    throw new Error('Cannot resolve background page main.');
                }
                return bgPage.bytegardenMain;
            });
        }
    };
}

@NgModule({
    imports: [
        ToasterModule,
    ],
    declarations: [],
    providers: [
        ValidationService,
        AuthGuardService,
        LaunchGuardService,
        PopupUtilsService,
        BroadcasterService,
        { provide: MessagingService, useValue: messagingService },
        { provide: AuthServiceAbstraction, useValue: authService },
        { provide: StateServiceAbstraction, useValue: stateService },
        { provide: SearchServiceAbstraction, useValue: searchService },
        { provide: AuditService, useFactory: getBgService<AuditService>('auditService'), deps: [] },
        { provide: CipherService, useFactory: getBgService<CipherService>('cipherService'), deps: [] },
        { provide: FolderService, useFactory: getBgService<FolderService>('folderService'), deps: [] },
        { provide: CollectionService, useFactory: getBgService<CollectionService>('collectionService'), deps: [] },
        { provide: EnvironmentService, useFactory: getBgService<EnvironmentService>('environmentService'), deps: [] },
        { provide: TotpService, useFactory: getBgService<TotpService>('totpService'), deps: [] },
        { provide: TokenService, useFactory: getBgService<TokenService>('tokenService'), deps: [] },
        { provide: I18nService, useFactory: getBgService<I18nService>('i18nService'), deps: [] },
        { provide: CryptoService, useFactory: getBgService<CryptoService>('cryptoService'), deps: [] },
        { provide: EventService, useFactory: getBgService<EventService>('eventService'), deps: [] },
        {
            provide: PlatformUtilsService,
            useFactory: getBgService<PlatformUtilsService>('platformUtilsService'),
            deps: [],
        },
        {
            provide: PasswordGenerationService,
            useFactory: getBgService<PasswordGenerationService>('passwordGenerationService'),
            deps: [],
        },
        { provide: ApiService, useFactory: getBgService<ApiService>('apiService'), deps: [] },
        { provide: SyncService, useFactory: getBgService<SyncService>('syncService'), deps: [] },
        { provide: UserService, useFactory: getBgService<UserService>('userService'), deps: [] },
        { provide: SettingsService, useFactory: getBgService<SettingsService>('settingsService'), deps: [] },
        { provide: LockService, useFactory: getBgService<LockService>('lockService'), deps: [] },
        { provide: StorageService, useFactory: getBgService<StorageService>('storageService'), deps: [] },
        { provide: AppIdService, useFactory: getBgService<AppIdService>('appIdService'), deps: [] },
        { provide: AutofillService, useFactory: getBgService<AutofillService>('autofillService'), deps: [] },
        { provide: ExportService, useFactory: getBgService<ExportService>('exportService'), deps: [] },
        {
            provide: NotificationsService,
            useFactory: getBgService<NotificationsService>('notificationsService'),
            deps: [],
        },
        {
            provide: APP_INITIALIZER,
            useFactory: initFactory,
            deps: [I18nService, StorageService, PopupUtilsService],
            multi: true,
        },
        {
            provide: LOCALE_ID,
            useFactory: () => getBgService<I18nService>('i18nService')().translationLocale,
            deps: [],
        },
    ],
})
export class ServicesModule {
}
