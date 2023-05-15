pipeline {
  agent {
    node {
      label 'nodejs-14.19.0'
    }
  }

  parameters {
    string(name:'TAG_NAME', defaultValue: '', description:'')
  }

  options {
    buildDiscarder(logRotator(numToKeepStr: '5'))
    quietPeriod(1)
  }

  environment {
    HARBOR_CREDENTIAL_ID = 'pipeline-user-harbor'
    KUBECONFIG_CREDENTIAL_ID = 'pipeline-user-kubeconfig'
    APP_NAME = 'test-coverage-server'
    GITLAB_URL = 'http://192.168.13.78/frontend/web/test-coverage-server.git'
    GITLAB_ID = 'pipeline-user-gitlab'
    GITLAB_USERNAME = 'pipeline-user'
    WX_WORK_TOKEN = '31e79e6a-fa8a-415b-8ecd-9ba0ba92320a'
  }

  stages {
    stage ('checkout scm') {
      steps {
        checkout([
        $class: 'GitSCM',
        branches: scm.branches,
        doGenerateSubmoduleConfigurations: false,
        extensions: [[
        $class: 'SubmoduleOption',
        disableSubmodules: false,
        parentCredentials: true,
        recursiveSubmodules: true,
        reference: '',
        trackingSubmodules: false]],
        submoduleCfg: [],
        userRemoteConfigs: scm.userRemoteConfigs])
        script {
          sh 'wget http://192.168.13.78/paas-pub/pipeline/-/raw/master/docker/vue/Dockerfile'
          sh 'wget http://192.168.13.78/paas-pub/pipeline/-/raw/master/script/notify-qywx.py'
        }
      }
    }

    stage ('build develop') {
      when {
        anyOf {
          branch 'develop'
          branch 'develop-deploy'
        }
      }
      environment {
        HARBOR_HOST = 'bytest-harbor.ur.com.cn'
        HARBOR_NAMESPACE = 'ur-dev'
        HARBOR_CREDENTIAL_ID = 'pipeline-user-harbor'
      }
      steps {
        container('nodejs') {
          sh 'pnpm -v'
          sh 'pnpm config set registry http://registry.npm.taobao.org'
          sh 'pnpm install'
          sh 'pnpm build:dev'
          sh 'docker build -f `pwd`/Dockerfile -t $HARBOR_HOST/$HARBOR_NAMESPACE/$APP_NAME:$BRANCH_NAME.$TAG_NAME.$BUILD_NUMBER .'
          withCredentials([usernamePassword(credentialsId : "$HARBOR_CREDENTIAL_ID" ,passwordVariable : 'HARBOR_PASSWORD' ,usernameVariable : 'HARBOR_USERNAME' ,)]) {
            sh 'echo "$HARBOR_PASSWORD" | docker login $HARBOR_HOST -u "$HARBOR_USERNAME" --password-stdin'
            sh 'docker push  $HARBOR_HOST/$HARBOR_NAMESPACE/$APP_NAME:$BRANCH_NAME.$TAG_NAME.$BUILD_NUMBER'
          }
        }
      }
      post {
        failure {
          sh 'python `pwd`/notify-front.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL Dev构建失败 $WX_WORK_TOKEN'
        }
      }
    }

    stage ('build test') {
      when {
        anyOf {
          branch 'test'
          branch 'test-deploy'
        }
      }
      environment {
        HARBOR_HOST = 'bytest-harbor.ur.com.cn'
        HARBOR_NAMESPACE = 'ur-test'
        HARBOR_CREDENTIAL_ID = 'pipeline-user-harbor'
      }
      steps {
        container('nodejs') {
          sh 'pnpm -v'
          sh 'pnpm install'
          sh 'pnpm build:test'
          sh 'docker build -f `pwd`/Dockerfile -t $HARBOR_HOST/$HARBOR_NAMESPACE/$APP_NAME:$BRANCH_NAME.$TAG_NAME.$BUILD_NUMBER .'
          withCredentials([usernamePassword(credentialsId : "$HARBOR_CREDENTIAL_ID" ,passwordVariable : 'HARBOR_PASSWORD' ,usernameVariable : 'HARBOR_USERNAME' ,)]) {
            sh 'echo "$HARBOR_PASSWORD" | docker login $HARBOR_HOST -u "$HARBOR_USERNAME" --password-stdin'
            sh 'docker push  $HARBOR_HOST/$HARBOR_NAMESPACE/$APP_NAME:$BRANCH_NAME.$TAG_NAME.$BUILD_NUMBER'
          }
        }
      }
      post {
        failure {
          sh 'python `pwd`/notify-front.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL Test构建失败 $WX_WORK_TOKEN'
        }
      }
    }

    stage ('build pre') {
      when {
        anyOf {
          branch 'pre'
          branch 'pre-deploy'
        }
      }
      environment {
        HARBOR_HOST = 'hw-harbor.ur.com.cn'
        HARBOR_NAMESPACE = 'ur-pre'
        HARBOR_CREDENTIAL_ID = 'pipeline-user-harbor'
      }
      steps {
        container('nodejs') {
          sh 'pnpm -v'
          sh 'pnpm install'
          sh 'pnpm build:pre'
          sh 'docker build -f `pwd`/Dockerfile -t $HARBOR_HOST/$HARBOR_NAMESPACE/$APP_NAME:$BRANCH_NAME-$BUILD_NUMBER .'
          withCredentials([usernamePassword(credentialsId : "$HARBOR_CREDENTIAL_ID" ,passwordVariable : 'HARBOR_PASSWORD' ,usernameVariable : 'HARBOR_USERNAME' ,)]) {
            sh 'echo "$HARBOR_PASSWORD" | docker login $HARBOR_HOST -u "$HARBOR_USERNAME" --password-stdin'
            sh 'docker push $HARBOR_HOST/$HARBOR_NAMESPACE/$APP_NAME:$BRANCH_NAME-$BUILD_NUMBER'
          }
        }
      }
      post {
        failure {
          sh 'python `pwd`/notify-front.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL Pre构建失败 $WX_WORK_TOKEN'
        }
      }
    }

    stage ('build release') {
      when {
        tag 'release-*'
      }
      environment {
        HARBOR_HOST = 'hw-harbor.ur.com.cn'
        HARBOR_NAMESPACE = 'ur-prod'
        HARBOR_CREDENTIAL_ID = 'pipeline-user-harbor'
      }
      steps {
        container('nodejs') {
          sh 'pnpm -v'
          sh 'pnpm install'
          sh 'pnpm build'
          sh 'docker build -f `pwd`/Dockerfile -t $HARBOR_HOST/$HARBOR_NAMESPACE/$APP_NAME:$BRANCH_NAME-$BUILD_NUMBER .'
          withCredentials([usernamePassword(credentialsId : "$HARBOR_CREDENTIAL_ID" ,passwordVariable : 'HARBOR_PASSWORD' ,usernameVariable : 'HARBOR_USERNAME' ,)]) {
            sh 'echo "$HARBOR_PASSWORD" | docker login $HARBOR_HOST -u "$HARBOR_USERNAME" --password-stdin'
            sh 'docker push $HARBOR_HOST/$HARBOR_NAMESPACE/$APP_NAME:$BRANCH_NAME-$BUILD_NUMBER'
          }
        }
      }
      post {
        failure {
          sh 'python `pwd`/notify-front.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL Prod构建失败 $WX_WORK_TOKEN'
        }
      }
    }

    stage('deploy to develop') {
      when {
        anyOf {
          branch 'develop'
          branch 'develop-deploy'
        }
      }
      environment {
        NAMESPACE =  'ur-dev'
        HARBOR_HOST = 'bytest-harbor.ur.com.cn'
        HARBOR_NAMESPACE = 'ur-dev'
      }
      steps {
        container ('nodejs') {
          withCredentials([kubeconfigFile(credentialsId: env.KUBECONFIG_CREDENTIAL_ID, variable: 'KUBECONFIG')]) {
            sh 'wget http://192.168.13.78/paas-pub/pipeline/-/raw/master/deploy/ur-platform/vue/dev/0.5c_512m/deployment.yaml'
            sh 'envsubst < `pwd`/deployment.yaml | cat -'
            sh 'envsubst < `pwd`/deployment.yaml | kubectl apply -f -'
          }
        }
      }
      post {
        always {
          sh 'python `pwd`/notify-front.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL Dev镜像部署成功 $WX_WORK_TOKEN'
        }
        failure {
          sh 'python `pwd`/notify-front.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL Dev镜像部署失败 $WX_WORK_TOKEN'
        }
      }
    }

    stage('deploy to test') {
      when {
        anyOf {
          branch 'test'
          branch 'test-deploy'
        }
      }
      environment {
        NAMESPACE =  'ur-test'
        HARBOR_HOST = 'bytest-harbor.ur.com.cn'
        HARBOR_NAMESPACE = 'ur-test'
      }
      steps {
        container ('nodejs') {
          withCredentials([kubeconfigFile(credentialsId: env.KUBECONFIG_CREDENTIAL_ID, variable: 'KUBECONFIG')]) {
            sh 'wget http://192.168.13.78/paas-pub/pipeline/-/raw/master/deploy/ur-platform/vue/dev/0.5c_512m/deployment.yaml'
            sh 'envsubst < `pwd`/deployment.yaml | cat -'
            sh 'envsubst < `pwd`/deployment.yaml | kubectl apply -f -'
          }
        }
      }
      post {
        always {
          sh 'python `pwd`/notify-front.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL Test镜像部署成功 $WX_WORK_TOKEN'
        }
        failure {
          sh 'python `pwd`/notify-front.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL Test镜像部署失败 $WX_WORK_TOKEN'
        }
      }
    }

    stage('deploy to pre') {
      when {
        anyOf {
          branch 'pre'
          branch 'pre-deploy'
        }
      }
      environment {
        NAMESPACE =  'ur-pre'
        HARBOR_HOST = 'hw-harbor.ur.com.cn'
        HARBOR_NAMESPACE = 'ur-pre'
      }
      steps {
        container ('nodejs') {
          withCredentials([kubeconfigFile(credentialsId: env.KUBECONFIG_CREDENTIAL_ID, variable: 'KUBECONFIG')]) {
            sh 'wget http://192.168.13.78/paas-pub/pipeline/-/raw/master/deploy/ur-platform/vue/pre/0.5c_1g/deployment.yaml'
            sh 'envsubst < `pwd`/deployment.yaml | cat -'
            sh 'envsubst < `pwd`/deployment.yaml | kubectl apply -f -'
          }
        }
      }
      post {
        always {
          sh 'python `pwd`/notify-front.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL Pre镜像部署成功 $WX_WORK_TOKEN'
        }
        failure {
          sh 'python `pwd`/notify-front.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL Pre镜像部署失败 $WX_WORK_TOKEN'
        }
      }
    }

    stage ('deploy release') {
      when {
        tag 'release-*'
      }
      environment {
        NAMESPACE =  'ur-prod'
        HARBOR_HOST = 'hw-harbor.ur.com.cn'
        HARBOR_NAMESPACE = 'ur-prod'
      }
      steps {
        container ('nodejs') {
          withCredentials([kubeconfigFile(credentialsId: env.KUBECONFIG_CREDENTIAL_ID, variable: 'KUBECONFIG')]) {
            sh 'wget http://192.168.13.78/paas-pub/pipeline/-/raw/master/deploy/ur-platform/vue/prod/0.5c_1g/deployment.yaml'
            sh 'envsubst < `pwd`/deployment.yaml | cat -'
            sh 'envsubst < `pwd`/deployment.yaml | kubectl apply -f -'
          }
        }
      }
      post {
        always {
          sh 'python `pwd`/notify-front.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL Prod镜像部署成功 $WX_WORK_TOKEN'
        }
        failure {
          sh 'python `pwd`/notify-front.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL Prod镜像部署失败 $WX_WORK_TOKEN'
        }
      }
    }
  }
}