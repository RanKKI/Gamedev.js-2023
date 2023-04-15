
declare namespace cocosExtend {
    /**
     * @cocosExtend.render 是 @orange.autorun 的扩展功能，在组件生效时才开始响应，组件失效时停止响应
     * @param target
     * @param key
     * @param baseDescriptor
     */
    function render(target: any, key: string, baseDescriptor: PropertyDescriptor): PropertyDescriptor;
}

declare namespace cc {
    namespace internal {
        namespace eventManager {
            function _setDirtyForNode(node: cc.Node);
            function _onTouchEventCallback(listener, argsObj);
        }

        namespace inputManager {
            function handleTouchesBegin(touches);
        }
    }
}


declare namespace orange {
 namespace cocos {
    /**
     * @cocos.render 是 @orange.autorun 的扩展功能，在组件生效时才开始响应，组件失效时停止响应
     * @param target
     * @param key
     * @param baseDescriptor
     */
    function render(target: any, key: string, baseDescriptor: PropertyDescriptor): PropertyDescriptor;
}

}