/**
 * @license Angular v0.10.1
 * (c) 2010-2019 Google LLC. https://angular.io/
 * License: MIT
 */
(function (factory) {
    typeof define === 'function' && define.amd ? define(factory) :
        factory();
}(function () {
    'use strict';
    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    Zone.__load_patch('notification', function (global, Zone, api) {
        var Notification = global['Notification'];
        if (!Notification || !Notification.prototype) {
            return;
        }
        var desc = Object.getOwnPropertyDescriptor(Notification.prototype, 'onerror');
        if (!desc || !desc.configurable) {
            return;
        }
        api.patchOnProperties(Notification.prototype, null);
    });
}));
