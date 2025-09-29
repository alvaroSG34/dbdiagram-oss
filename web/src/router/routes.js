const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        path: "",
        redirect: "/dashboard"
      },
      {
        path: "dashboard",
        component: () => import("pages/Dashboard.vue"),
        meta: { requiresAuth: true }
      },
      {
        path: "create-room",
        component: () => import("pages/CreateRoom.vue"),
        meta: { requiresAuth: true }
      },
      {
        path: "join-room", 
        component: () => import("pages/JoinRoom.vue"),
        meta: { requiresAuth: true }
      },
      {
        path: "room/:roomCode",
        component: () => import("pages/RoomEditor.vue"),
        meta: { requiresAuth: true }
      },
      {
        path: "editor",
        components: {
          default: () => import("pages/Editor/Index.vue"),
          toolbar: () => import("pages/Editor/Toolbar.vue")
        }
      },
      {
        path: "login",
        component: () => import("pages/auth/Login.vue")
      },
      {
        path: "register", 
        component: () => import("pages/auth/Register.vue")
      }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/Error404.vue")
  }
];

export default routes;
