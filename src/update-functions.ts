import { Action } from '@ngrx/store';

import {
  SetValueAction,
  SetErrorsAction,
  EnableAction,
  DisableAction,
  MarkAsDirtyAction,
  MarkAsPristineAction,
  MarkAsTouchedAction,
  MarkAsUntouchedAction,
  MarkAsSubmittedAction,
  MarkAsUnsubmittedAction,
  FocusAction,
  UnfocusAction,
  SetLastKeyDownCodeAction,
  AddControlAction,
  RemoveControlAction
} from './actions';
import {
  AbstractControlState,
  FormControlState,
  FormGroupState,
  FormGroupControls,
  KeyValue,
  ValidationErrors,
  FormControlValueTypes,
} from './state';
import { formControlReducer } from './control/reducer';
import { formGroupReducer } from './group/reducer';
import { isGroupState, computeGroupState } from './group/reducer/util';

export type ProjectFn<T> = (t: T) => T;
export type ProjectFn2<T, K> = (t: T, k: K) => T;
export type StateUpdateFns<TValue extends KeyValue> =
  {[controlId in keyof TValue]?: ProjectFn2<AbstractControlState<TValue[controlId]>, FormGroupState<TValue>> };

function updateControlsState<TValue extends KeyValue>(updateFns: StateUpdateFns<TValue>) {
  return (state: FormGroupState<TValue>) => {
    let hasChanged = false;
    const newControls = Object.keys(state.controls).reduce((res, key) => {
      const control = state.controls[key];
      res[key] = control;
      if (updateFns.hasOwnProperty(key)) {
        const newControl = updateFns[key]!(control, state);
        hasChanged = hasChanged || newControl !== control;
        res[key] = newControl;
      }
      return res;
    }, {} as FormGroupControls<TValue>);
    return hasChanged ? newControls : state.controls;
  };
}

function updateGroupSingle<TValue extends object>(updateFns: StateUpdateFns<TValue>) {
  return (state: FormGroupState<TValue>): FormGroupState<TValue> => {
    const newControls = updateControlsState<TValue>(updateFns)(state);
    return newControls !== state.controls ? computeGroupState<TValue>(state.id, newControls, state.value, state.errors) : state;
  };
}

export function updateGroup<TValue extends object>(...updateFnsArr: Array<StateUpdateFns<TValue>>) {
  return (state: FormGroupState<TValue>): FormGroupState<TValue> => {
    return updateFnsArr.reduce((s, updateFns) => updateGroupSingle<TValue>(updateFns)(s), state);
  };
}

export function compose<T>(...fns: Array<(t: T) => T>) {
  return (t: T) => fns.reduce((res, f) => f(res), t);
}

export function groupUpdateReducer<TValue extends object>(...updateFnsArr: Array<StateUpdateFns<TValue>>) {
  return (state: FormGroupState<TValue>, action: Action) =>
    compose<FormGroupState<TValue>>(
      s => formGroupReducer(s, action),
      updateGroup<TValue>(...updateFnsArr),
    )(state);
}

function abstractControlReducer<TValue>(state: AbstractControlState<TValue>, action: Action): AbstractControlState<TValue> {
  return isGroupState(state) ? formGroupReducer(state as any, action) as any : formControlReducer(state as any, action);
}

function ensureState<TValue>(state: AbstractControlState<TValue>) {
  if (!state) {
    throw new Error('state must not be undefined!');
  }

  return state;
}

// TODO: enable all overloads once conditional mapped types are implemented (https://github.com/Microsoft/TypeScript/issues/12424)

// export function setValue<TValue extends FormControlValueTypes>(value: TValue): ProjectFn<FormControlState<TValue>>;
// export function setValue<TValue extends KeyValue>(value: TValue): ProjectFn<FormGroupState<TValue>>;
export function setValue<TValue>(value: TValue): ProjectFn<AbstractControlState<TValue>>;
export function setValue<TValue>(value: TValue, state: AbstractControlState<TValue>): AbstractControlState<TValue>;
export function setValue<TValue>(value: TValue, state?: AbstractControlState<TValue>) {
  if (!!state) {
    return abstractControlReducer(state, new SetValueAction(state.id, value));
  }

  return (s: AbstractControlState<TValue>) => setValue(value, ensureState(s));
}

// export function validate<TValue extends FormControlValueTypes>(validatorFn: (value: TValue) => ValidationErrors): ProjectFn<FormControlState<TValue>>;
// export function validate<TValue extends KeyValue>(validatorFn: (value: TValue) => ValidationErrors): ProjectFn<FormGroupState<TValue>>;
export function validate<TValue>(validatorFn: (value: TValue) => ValidationErrors): ProjectFn<AbstractControlState<TValue>>;
export function validate<TValue>(validatorFn: (value: TValue) => ValidationErrors, state: AbstractControlState<TValue>): AbstractControlState<TValue>;
export function validate<TValue>(validatorFn: (value: TValue) => ValidationErrors, state?: AbstractControlState<TValue>) {
  if (!!state) {
    return abstractControlReducer(state, new SetErrorsAction(state.id, validatorFn(state.value)));
  }

  return (s: AbstractControlState<TValue>) => validate(validatorFn, ensureState(s));
}

// export function enable<TValue extends FormControlValueTypes>(state: FormControlState<TValue>): FormControlState<TValue>;
// export function enable<TValue extends KeyValue>(state: FormGroupState<TValue>): FormGroupState<TValue>;
export function enable<TValue>(state: AbstractControlState<TValue>) {
  return abstractControlReducer(state, new EnableAction(state.id));
}

// export function disable<TValue extends FormControlValueTypes>(state: FormControlState<TValue>): FormControlState<TValue>;
// export function disable<TValue extends KeyValue>(state: FormGroupState<TValue>): FormGroupState<TValue>;
export function disable<TValue>(state: AbstractControlState<TValue>) {
  return abstractControlReducer(state, new DisableAction(state.id));
}

// export function markAsDirty<TValue extends FormControlValueTypes>(state: FormControlState<TValue>): FormControlState<TValue>;
// export function markAsDirty<TValue extends KeyValue>(state: FormGroupState<TValue>): FormGroupState<TValue>;
export function markAsDirty<TValue>(state: AbstractControlState<TValue>) {
  return abstractControlReducer(state, new MarkAsDirtyAction(state.id));
}

// export function markAsPristine<TValue extends FormControlValueTypes>(state: FormControlState<TValue>): FormControlState<TValue>;
// export function markAsPristine<TValue extends KeyValue>(state: FormGroupState<TValue>): FormGroupState<TValue>;
export function markAsPristine<TValue>(state: AbstractControlState<TValue>) {
  return abstractControlReducer(state, new MarkAsPristineAction(state.id));
}

// export function markAsTouched<TValue extends FormControlValueTypes>(state: FormControlState<TValue>): FormControlState<TValue>;
// export function markAsTouched<TValue extends KeyValue>(state: FormGroupState<TValue>): FormGroupState<TValue>;
export function markAsTouched<TValue>(state: AbstractControlState<TValue>) {
  return abstractControlReducer(state, new MarkAsTouchedAction(state.id));
}

// export function markAsUntouched<TValue extends FormControlValueTypes>(state: FormControlState<TValue>): FormControlState<TValue>;
// export function markAsUntouched<TValue extends KeyValue>(state: FormGroupState<TValue>): FormGroupState<TValue>;
export function markAsUntouched<TValue>(state: AbstractControlState<TValue>) {
  return abstractControlReducer(state, new MarkAsUntouchedAction(state.id));
}

// export function markAsSubmitted<TValue extends FormControlValueTypes>(state: FormControlState<TValue>): FormControlState<TValue>;
// export function markAsSubmitted<TValue extends KeyValue>(state: FormGroupState<TValue>): FormGroupState<TValue>;
export function markAsSubmitted<TValue>(state: AbstractControlState<TValue>) {
  return abstractControlReducer(state, new MarkAsSubmittedAction(state.id));
}

// export function markAsUnsubmitted<TValue extends FormControlValueTypes>(state: FormControlState<TValue>): FormControlState<TValue>;
// export function markAsUnsubmitted<TValue extends KeyValue>(state: FormGroupState<TValue>): FormGroupState<TValue>;
export function markAsUnsubmitted<TValue>(state: AbstractControlState<TValue>) {
  return abstractControlReducer(state, new MarkAsUnsubmittedAction(state.id));
}

export function focus<TValue extends FormControlValueTypes>(state: FormControlState<TValue>) {
  return formControlReducer(state, new FocusAction(state.id));
}

export function unfocus<TValue extends FormControlValueTypes>(state: FormControlState<TValue>) {
  return formControlReducer(state, new UnfocusAction(state.id));
}

export function setLastKeyDownCode<TValue extends FormControlValueTypes>(code: number) {
  return (state: FormControlState<TValue>) => formControlReducer(state, new SetLastKeyDownCodeAction(state.id, code));
}

export function addControl<TValue extends KeyValue, TControlKey extends keyof TValue>(
  name: keyof TValue,
  value: TValue[TControlKey],
) {
  return (state: FormGroupState<TValue>) => formGroupReducer(state, new AddControlAction<TValue, TControlKey>(state.id, name, value));
}

export function removeControl<TValue extends KeyValue>(name: keyof TValue) {
  return (state: FormGroupState<TValue>) => formGroupReducer(state, new RemoveControlAction<TValue>(state.id, name));
}
