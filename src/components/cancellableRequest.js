import { AbortController } from '@openeo/js-client';
import Utils from '../utils';

export class CancellableRequestError extends Error {
  constructor(message, title = null, cause = null, close = true, isError = true) {
    super(message, {cause});
    this.title = title;
    this.close = close;
    this.isError = isError;
  }
}

export function showCancellableRequestError(vm, error) {
  if (error instanceof CancellableRequestError) {
    if (error.isError) {
      Utils.error(vm, error.message, error.title);
    }
    else {
      Utils.ok(vm, error.message, error.title);
    }
  }
}

let runIds = {};
export async function cancellableRequest(vm, callback, entity) {
  if (!runIds[entity]) {
    runIds[entity] = 1;
  }
  else {
    runIds[entity]++;
  }

  const abortController = new AbortController();
  const snotifyConfig = Object.assign({}, vm.$config.snotifyDefaults, {
    timeout: 0,
    type: 'async',
    buttons: [{
      text: 'Cancel',
      action: () => {
        abortController.abort();
      }
    }]
  });

  let toast;
  const toastTitle = `${entity} #${runIds[entity]}`;
  try {
    const message = `Processing in progress, please wait...`;
    // Pass a promise to snotify that never resolves as we manually close the toast
    const endlessPromise = () => new Promise(() => {});
    toast = vm.$snotify.async(message, toastTitle, endlessPromise, snotifyConfig);

    await callback(abortController);
  } catch(error) {
    if (Utils.axios().isCancel(error)) {
      throw new CancellableRequestError(`Cancelled successfully`, toastTitle, error, false, false);
    }
    else if (typeof error.message === 'string' && Utils.isObject(error.response) && [400,500].includes(error.response.status)) {
      vm.broadcast('viewLogs', [{
        id: error.id,
        code: error.code,
        level: 'error',
        message: error.message,
        links: error.links || []
      }]);
      Utils.error(vm, `${entity} failed. Please see the logs for details.`, toastTitle);
    }
    else {
      throw new CancellableRequestError(error.message, toastTitle, error, false);
    }
  } finally {
    if (toast) {
      vm.$snotify.remove(toast.id, true);
    }
  }
}