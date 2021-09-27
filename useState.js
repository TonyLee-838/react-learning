let isMount = true;
let workInProgressHook = null;
let App_CurrentFiber = {
    memorizedState: null,
    stateNode: App,
    ref: null,
};
function useState(initialState) {
    let hook = null;
    if (isMount) {
        //init hook
        hook = {
            queue: {
                pending: null,
            },
            memorizedState: initialState,
            next: null,
        };
        //新hook注冊到組件組件中
        if (!App_CurrentFiber.memorizedState) {
            //First Hook
            App_CurrentFiber.memorizedState = hook;
        }
        else {
            //Append Hook
            workInProgressHook.next = hook;
        }
        //Move pointer to the very last hook
        workInProgressHook = hook;
    }
    else {
        //take first hook
        hook = workInProgressHook;
        //move pointer to the next hook
        workInProgressHook = workInProgressHook.next;
    }
    let baseState = hook.memorizedState;
    const hasPendingHooks = !!hook.queue.pending;
    if (hasPendingHooks) {
        //hook.queue.pending =(next)=> lastUpdate =(next)> firstUpdate
        let firstUpdate = hook.queue.pending.next;
        do {
            const updatedState = firstUpdate.action(baseState);
            baseState = updatedState;
            firstUpdate = firstUpdate.next;
        } while (hook.queue.pending.next !== firstUpdate);
        //All pending hook are processed.Clean up the queue.
        hook.queue.pending = null;
    }
    hook.memorizedState = baseState;
    return [
        baseState,
        (action) => dispatchAction(hook.queue, action),
    ];
}
function dispatchAction(queue, action) {
    const update = {
        next: null,
        action,
    };
    if (!queue.pending) {
        //環狀鏈表構建
        update.next = update;
    }
    else {
        //1)
        //                  queue.pending
        //                        v
        //              A -> B -> C ;
        //              ^         |
        //              |_________|
        update.next = queue.pending.next;
        //2)
        //                  queue.pending
        //                        v
        //         U -> A -> B -> C ;
        //              ^         |
        //              |_________|
        queue.pending.next = update;
        //3)
        //                  queue.pending
        //                        v
        //         U -> A -> B -> C ;
        //         ^              |
        //         |______________|
    }
    queue.pending = update;
    //4)
    // queue.pending
    //        v
    //        U -> A -> B -> C ;
    //        ^              |
    //        |______________|
    scheduleUpdates();
}
function scheduleUpdates() {
    //hook以鏈表結構連接
    const firstHook = App_CurrentFiber.memorizedState;
    //當前正在工作的hook
    workInProgressHook = firstHook;
    //render App()
    App_CurrentFiber.ref = App_CurrentFiber.stateNode();
    isMount = false;
}
function App() {
    const [number, setNumber] = useState(0);
    const [string, setString] = useState("");
    function handleClick() {
        setNumber((number) => number + 1);
        setNumber((number) => number + 1);
        setNumber((number) => number + 1);
        setString((str) => str + "a");
    }
    console.log(`<button>${number + "\t" + string}</button>`);
    return {
        type: "button",
        key: null,
        click() {
            handleClick();
        },
    };
}
function mount() {
    const ref = App();
    isMount = false;
    return ref;
}
function renderButton() {
    console.log("render!!!");
    const { click } = mount();
    click();
    click();
    click();
    click();
}
renderButton();
